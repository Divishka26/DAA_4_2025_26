let G       = {};
let nodes   = [];
let pos     = {};
let steps   = [];
let si      = 0;
let running = false;
let timer   = null;

const startSel  = document.getElementById('start-select');
const edgeTA    = document.getElementById('edge-input');
const btnLoad   = document.getElementById('btn-load');
const btnStart  = document.getElementById('btn-start');
const btnStep   = document.getElementById('btn-step');
const btnStop   = document.getElementById('btn-stop');
const btnReset  = document.getElementById('btn-reset');
const spdRng    = document.getElementById('speed-range');
const spdLbl    = document.getElementById('speed-lbl');
const toastEl   = document.getElementById('toast');
const distFromEl = document.getElementById('dist-from');

let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

function setCtrl(on) {
  btnStart.disabled = on;
  btnStep.disabled  = !on;
  btnStop.disabled  = !on;
}

function stopAuto() {
  if (timer) { clearTimeout(timer); timer = null; }
  running = false;
}

function scheduleNext() {
  if (!running) return;
  if (si >= steps.length - 1) { running = false; return; }

  timer = setTimeout(() => {
    si++;
    renderStep(si, steps[si]);
    if (si < steps.length - 1) {
      scheduleNext();
    } else {
      running = false;
      toast('Done! All shortest paths found ✓');
    }
  }, +spdRng.value);
}

function clearUI() {
  document.getElementById('step-pill').innerHTML    = '—';
  document.getElementById('expl-content').innerHTML =
    '<p>Press <strong style="color:var(--green)">Start</strong> to begin.</p>';
  document.getElementById('tbl-body').innerHTML     = '';
  document.getElementById('d-chips').innerHTML      = '';
  document.getElementById('dist-from').textContent  = '—';
}

function loadGraph() {
  stopAuto();

  G     = parseEdges(edgeTA.value);
  nodes = Object.keys(G).sort();

  if (!nodes.length) {
    toast('⚠ No valid edges found!');
    return;
  }

  startSel.innerHTML = '';
  nodes.forEach(n => {
    const o = document.createElement('option');
    o.value = n; o.textContent = n;
    startSel.appendChild(o);
  });

  const r = svgEl.getBoundingClientRect();
  pos = circleLayout(nodes, r.width || 760, r.height || 280);

  steps   = [];
  si      = 0;
  running = false;

  setCtrl(false);
  drawGraph(null);
  clearUI();
  toast('Graph loaded ✓');
}

btnLoad.addEventListener('click', loadGraph);

btnStart.addEventListener('click', () => {
  if (!nodes.length) { toast('Load a graph first!'); return; }

  const src = startSel.value;
  steps   = dijkstra(G, nodes, src);
  si      = 0;
  running = true;

  distFromEl.textContent = src;
  setCtrl(true);
  renderStep(si, steps[si]);
  scheduleNext();
});

btnStep.addEventListener('click', () => {
  stopAuto();
  if (si < steps.length - 1) {
    si++;
    renderStep(si, steps[si]);
    if (si === steps.length - 1) {
      btnStep.disabled = true;
      toast('Done! ✓');
    }
  }
});

btnStop.addEventListener('click', () => {
  stopAuto();
  setCtrl(false);
  if (nodes.length) drawGraph(null);
  clearUI();
  steps = [];
  si    = 0;
});

btnReset.addEventListener('click', () => {
  stopAuto();
  edgeTA.value = `A B 4\nA C 2\nB C 5\nB D 10\nC E 3\nE D 4\nB E 6\nD F 11\nE F 2`;
  G = {}; nodes = []; pos = {}; steps = []; si = 0;
  setCtrl(false);
  svgEl.innerHTML = '';
  clearUI();
  startSel.innerHTML = '';
  setTimeout(loadGraph, 60);
});

spdRng.addEventListener('input', () => {
  spdLbl.textContent = (+spdRng.value / 1000).toFixed(1) + 's';
});

let rtimer;
window.addEventListener('resize', () => {
  clearTimeout(rtimer);
  rtimer = setTimeout(() => {
    if (!nodes.length) return;
    const r = svgEl.getBoundingClientRect();
    pos = circleLayout(nodes, r.width, r.height);
    steps.length ? renderStep(si, steps[si]) : drawGraph(null);
  }, 120);
});

window.addEventListener('load', () => setTimeout(loadGraph, 90));
