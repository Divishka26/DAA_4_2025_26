const INF = Infinity;

function dijkstra(G, nodes, src) {
  const dist    = {};
  const prev    = {};
  const visited = new Set();
  const visEdges = new Set();
  const out     = [];

  nodes.forEach(n => {
    dist[n] = INF;
    prev[n] = null;
  });
  dist[src] = 0;

  function snap(type, cur, updates, expl) {
    out.push({
      type,
      cur,
      dist:     { ...dist },
      prev:     { ...prev },
      visited:  new Set(visited),
      visEdges: new Set(visEdges),
      updates,
      expl,
    });
  }

  snap('init', null, [], 'Distances initialised. Source = 0, all others = ∞.');

  for (let i = 0; i < nodes.length; i++) {
    let u = null;
    nodes.forEach(n => {
      if (!visited.has(n) && dist[n] < INF) {
        if (u === null || dist[n] < dist[u]) u = n;
      }
    });
    if (u === null) break;

    visited.add(u);

    const updates = [];
    for (const { to: v, w } of (G[u] || [])) {
      if (visited.has(v)) continue;

      const oldDist = dist[v];
      const alt     = dist[u] + w;
      const improved = alt < oldDist;

      if (improved) {
        dist[v] = alt;
        prev[v] = u;
      }

      updates.push({ node: v, w, newD: dist[v], old: oldDist, upd: improved });
    }

    nodes.forEach(n => {
      if (prev[n]) visEdges.add(edgeKey(prev[n], n));
    });

    const expl = updates.length
      ? `From node ${u}, examining neighbours:`
      : `Node ${u} has no unvisited neighbours.`;

    snap('visit', u, updates, expl);
  }

  snap('done', null, [], '✓ Algorithm complete — all shortest paths found!');
  return out;
}
