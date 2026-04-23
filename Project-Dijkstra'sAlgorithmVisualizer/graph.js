function parseEdges(raw) {
  const G = {};
  const lines = raw.trim().split('\n');

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;

    const u = parts[0].toUpperCase();
    const v = parts[1].toUpperCase();
    const w = parseFloat(parts[2]);

    if (isNaN(w)) continue;

    if (!G[u]) G[u] = [];
    if (!G[v]) G[v] = [];

    G[u].push({ to: v, w });
    G[v].push({ to: u, w });
  }

  return G;
}

function edgeKey(a, b) {
  return [a, b].sort().join('-');
}

function circleLayout(nodeList, W, H) {
  const pos = {};
  const n = nodeList.length;
  const cx = W / 2;
  const cy = H / 2;
  const r  = Math.min(W, H) * 0.36;

  nodeList.forEach((nd, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    pos[nd] = {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  return pos;
}
