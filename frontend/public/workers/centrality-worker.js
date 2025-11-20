// Centrality worker: computes (approximate) betweenness centrality
self.onmessage = function (ev) {
  const msg = ev.data || {}
  if (msg.type !== 'compute') return

  const nodes = msg.nodes || []
  const links = msg.links || []
  const requestedSampleSize = Number(msg.sampleSize || 60)
  const sampleStrategy = String(msg.sampleStrategy || 'auto')

  const nodeIds = nodes.map(n => n.id)
  const adj = {}
  nodeIds.forEach(id => { adj[id] = [] })
  links.forEach(l => {
    const s = String(l.source)
    const t = String(l.target)
    if (adj[s]) adj[s].push(t)
    if (adj[t]) adj[t].push(s)
  })

  // select sources according to strategy
  const SAMPLE_THRESHOLD = 500
  let sources = []
  if (sampleStrategy === 'full') {
    sources = nodeIds
  } else if (sampleStrategy === 'high-degree') {
    const deg = {}
    nodeIds.forEach(id => deg[id] = 0)
    links.forEach(l => { deg[String(l.source)] = (deg[String(l.source)] || 0) + 1; deg[String(l.target)] = (deg[String(l.target)] || 0) + 1 })
    const sorted = nodeIds.slice().sort((a,b) => (deg[b]||0) - (deg[a]||0))
    sources = sorted.slice(0, Math.min(requestedSampleSize, nodeIds.length))
  } else if (sampleStrategy === 'random') {
    const shuffled = nodeIds.slice()
    for (let i = shuffled.length -1; i>0; i--) {
      const j = Math.floor(Math.random() * (i+1))
      const tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp
    }
    sources = shuffled.slice(0, Math.min(requestedSampleSize, nodeIds.length))
  } else {
    // auto: choose a deterministic high-degree sample when graph is large, otherwise run full
    if (nodeIds.length > SAMPLE_THRESHOLD) {
      const deg = {}
      nodeIds.forEach(id => deg[id] = 0)
      links.forEach(l => { deg[String(l.source)] = (deg[String(l.source)] || 0) + 1; deg[String(l.target)] = (deg[String(l.target)] || 0) + 1 })
      const sorted = nodeIds.slice().sort((a,b) => (deg[b]||0) - (deg[a]||0))
      sources = sorted.slice(0, Math.min(requestedSampleSize, nodeIds.length))
    } else {
      sources = nodeIds
    }
  }

  // Brandes (approx) over sources
  const betweenness = {}
  nodeIds.forEach(id => betweenness[id] = 0)

  for (let si = 0; si < sources.length; si++) {
    const s = sources[si]
    const stack = []
    const pred = {}
    const sigma = {}
    const dist = {}
    nodeIds.forEach(v => { pred[v] = []; sigma[v] = 0; dist[v] = -1 })
    sigma[s] = 1; dist[s] = 0
    const queue = [s]
    while (queue.length) {
      const v = queue.shift()
      stack.push(v)
      const neighbors = adj[v] || []
      for (let k=0;k<neighbors.length;k++){
        const w = neighbors[k]
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1
          queue.push(w)
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] = (sigma[w] || 0) + sigma[v]
          pred[w].push(v)
        }
      }
    }

    const delta = {}
    nodeIds.forEach(v => delta[v] = 0)
    while (stack.length) {
      const w = stack.pop()
      const pw = pred[w]
      for (let pi=0; pi<pw.length; pi++){
        const v = pw[pi]
        delta[v] += (sigma[v] / (sigma[w] || 1)) * (1 + delta[w])
      }
      if (w !== s) betweenness[w] += delta[w]
    }
  }

  // send result
  self.postMessage({ type: 'result', betweenness })
}

// allow worker to be terminated gracefully
self.onclose = function () { /* noop */ }
