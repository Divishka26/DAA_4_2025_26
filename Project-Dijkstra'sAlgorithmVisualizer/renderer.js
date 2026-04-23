const SVGNS   = 'http://www.w3.org/2000/svg';
const NODE_R  = 22;

const svgEl    = document.getElementById('graph-svg');
const tblBody  = document.getElementById('tbl-body');
const stepPill = document.getElementById('step-pill');
const expCont  = document.getElementById('expl-content');
const dChips   = document.getElementById('d-chips');
const distFrom = document.getElementById('dist-from');

function mk(tag) {
  return document.createElementNS(SVGNS, tag);
}

function drawGraph(step) {
  svgEl.innerHTML = '';
  const rect = svgEl.getBoundingClientRect();
  const W = rect.width  || 760;
  const H = rect.height || 280;
  svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);

  if (!nodes.length) return;

  const cur      = step?.cur      ?? null;
  const visited  = step?.visited  ?? new Set();
  const visEdges = step?.visEdges ?? new Set();
  const startNode = document.getElementById('start-select').value;

  const drawn = new Set();
  nodes.forEach(u => {
    (G[u] || []).forEach(({ to: v, w }) => {
      const key = edgeKey(u, v);
      if (drawn.has(key)) return;
      drawn.add(key);

      const p1 = pos[u];
      const p2 = pos[v];
      if (!p1 || !p2) return;

      const isVis = visEdges.has(key);

      const ln = mk('line');
      ln.setAttribute('x1', p1.x); ln.setAttribute('y1', p1.y);
      ln.setAttribute('x2', p2.x); ln.setAttribute('y2', p2.y);
      ln.setAttribute('class', `e-line ${isVis ? 'e-vis' : 'e-unvis'}`);
      svgEl.appendChild(ln);

      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ox = (-dy / len) * 11;
      const oy = ( dx / len) * 11;

      const wStr = w.toString();
      const twBg = wStr.length * 7 + 6;

      const bg = mk('rect');
      bg.setAttribute('x',      mx + ox - twBg / 2);
      bg.setAttribute('y',      my + oy - 7);
      bg.setAttribute('width',  twBg);
      bg.setAttribute('height', 14);
      bg.setAttribute('rx',     3);
      bg.setAttribute('class',  'e-wt-bg');
      svgEl.appendChild(bg);

      const wt = mk('text');
      wt.setAttribute('x',     mx + ox);
      wt.setAttribute('y',     my + oy + 1);
      wt.setAttribute('class', 'e-wt');
      wt.textContent = w;
      svgEl.appendChild(wt);
    });
  });

  nodes.forEach(nd => {
    const p = pos[nd];
    if (!p) return;

    let cls = 'n-unvis';
    if (nd === startNode)    cls = 'n-start';
    if (visited.has(nd))     cls = 'n-vis';
    if (nd === cur)          cls = 'n-cur';

    if (nd === cur) {
      const ring = mk('circle');
      ring.setAttribute('cx', p.x);
      ring.setAttribute('cy', p.y);
      ring.setAttribute('r',  NODE_R + 4);
      ring.setAttribute('class', 'pulse');
      svgEl.appendChild(ring);
    }

    const c = mk('circle');
    c.setAttribute('cx',    p.x);
    c.setAttribute('cy',    p.y);
    c.setAttribute('r',     NODE_R);
    c.setAttribute('class', `n-circle ${cls}`);
    svgEl.appendChild(c);

    const lbl = mk('text');
    lbl.setAttribute('x',     p.x);
    lbl.setAttribute('y',     p.y);
    lbl.setAttribute('class', 'n-lbl');
    lbl.textContent = nd;
    svgEl.appendChild(lbl);

    if (step && step.dist[nd] !== INF) {
      const badge = mk('text');
      badge.setAttribute('x',                  p.x + NODE_R - 2);
      badge.setAttribute('y',                  p.y - NODE_R + 2);
      badge.setAttribute('text-anchor',        'middle');
      badge.setAttribute('dominant-baseline',  'central');
      badge.setAttribute('font-size',          '9');
      badge.setAttribute('font-family',        'Fira Code, monospace');
      badge.setAttribute('font-weight',        '700');
      badge.setAttribute('fill',
        nd === cur        ? '#fbbf24'
        : visited.has(nd) ? '#22d3a5'
        :                   '#60a5fa'
      );
      badge.textContent = step.dist[nd];
      svgEl.appendChild(badge);
    }
  });
}

function renderStep(i, step) {
  drawGraph(step);
  renderTable(step);
  renderPill(i, step);
  renderExplanation(step);
  renderChips(step);
}

function renderTable(step) {
  tblBody.innerHTML = '';
  nodes.forEach(nd => {
    const tr     = document.createElement('tr');
    const isCur  = nd === step.cur;
    const isVis  = step.visited.has(nd) && !isCur;

    if (isCur)      tr.className = 'row-cur';
    else if (isVis) tr.className = 'row-vis';

    const d = step.dist[nd];
    tr.innerHTML = `
      <td>${nd}</td>
      <td>${d === INF ? '∞' : d}</td>
      <td>${step.prev[nd] ?? '—'}</td>
    `;
    tblBody.appendChild(tr);
  });
}

function renderPill(i, step) {
  if (step.type === 'init') {
    stepPill.innerHTML =
      `<span class="badge">INIT</span> Distances initialised`;
  } else if (step.type === 'done') {
    stepPill.innerHTML =
      `<span class="badge" style="border-color:var(--green);color:var(--green);background:var(--green-dim)">DONE</span>
       All shortest paths computed ✓`;
  } else {
    const d = step.dist[step.cur];
    stepPill.innerHTML =
      `<span class="badge">STEP ${i}</span>
       Pick node <b style="color:var(--amber)">${step.cur}</b> —
       distance <b style="color:var(--amber)">${d}</b>`;
  }
}

function renderExplanation(step) {
  if (!step.updates?.length || step.type === 'init' || step.type === 'done') {
    expCont.innerHTML = `<p>${step.expl}</p>`;
    return;
  }

  let h = `<p>${step.expl}</p><ul>`;
  step.updates.forEach(u => {
    const alt = step.dist[step.cur] + u.w;
    const old = u.old === INF ? '∞' : u.old;
    if (u.upd) {
      h += `<li class="upd">✓&nbsp; ${u.node}: ${step.dist[step.cur]} + ${u.w} = ${u.newD} &nbsp;<span style="opacity:.5">(was ${old})</span></li>`;
    } else {
      h += `<li class="noup">✗&nbsp; ${u.node}: ${step.dist[step.cur]} + ${u.w} = ${alt} &nbsp;<span style="opacity:.5">(no update, best = ${old})</span></li>`;
    }
  });
  h += '</ul>';
  expCont.innerHTML = h;
}

function renderChips(step) {
  dChips.innerHTML = '';
  nodes.forEach(nd => {
    const d    = step.dist[nd];
    const chip = document.createElement('div');
    chip.className = 'd-chip' + (step.type === 'done' && d !== INF ? ' done' : '');
    chip.innerHTML = `${nd}: <span class="v">${d === INF ? '∞' : d}</span>`;
    dChips.appendChild(chip);
  });
}
