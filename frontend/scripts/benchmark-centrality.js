// Node.js benchmark for betweenness centrality (exact and sampled)
// Usage: node scripts/benchmark-centrality.js

function generateGraph(n, avgDegree) {
  const nodes = []
  const links = []
  for (let i = 0; i < n; i++) nodes.push({ id: `N-${i}` })
  // Ensure connectivity-ish: connect to next k nodes modulo n
  const k = Math.max(1, Math.floor(avgDegree / 2))
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= k; j++) {
      const t = (i + j) % n
      links.push({ source: `N-${i}`, target: `N-${t}` })
    }
  }
  // add some random extra edges to reach approx avgDegree
  const extra = Math.max(0, Math.floor((avgDegree - 2 * k) * n / 2))
  for (let e = 0; e < extra; e++) {
    const a = Math.floor(Math.random() * n)
    const b = Math.floor(Math.random() * n)
    if (a !== b) links.push({ source: `N-${a}`, target: `N-${b}` })
  }
  return { nodes, links }
}

function sampleSources(nodeIds, strategy, sampleSize, links) {
  if (strategy === 'full') return nodeIds.slice()
  if (strategy === 'high-degree') {
    const deg = {}
    nodeIds.forEach(id => deg[id] = 0)
    links.forEach(l => { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1 })
    const sorted = nodeIds.slice().sort((a, b) => (deg[b] || 0) - (deg[a] || 0))
    return sorted.slice(0, Math.min(sampleSize, nodeIds.length))
  }
  // random
  const shuffled = nodeIds.slice()
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp
  }
  return shuffled.slice(0, Math.min(sampleSize, nodeIds.length))
}

function computeBetweenness(nodes, links, options = {}) {
  const nodeIds = nodes.map(n => n.id)
  const adj = {}
  nodeIds.forEach(id => { adj[id] = [] })
  links.forEach(l => {
    const s = String(l.source)
    const t = String(l.target)
    if (adj[s]) adj[s].push(t)
    if (adj[t]) adj[t].push(s)
  })

  const sampleSize = options.sampleSize || 60
  const strategy = options.strategy || 'auto'
  const SAMPLE_THRESHOLD = 500
  let sources = []
  if (strategy === 'full') sources = nodeIds
  else if (strategy === 'high-degree') sources = sampleSources(nodeIds, 'high-degree', sampleSize, links)
  else if (strategy === 'random') sources = sampleSources(nodeIds, 'random', sampleSize, links)
  else {
    if (nodeIds.length > SAMPLE_THRESHOLD) sources = sampleSources(nodeIds, 'random', sampleSize, links)
    else sources = nodeIds
  }

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
      for (let k = 0; k < neighbors.length; k++) {
        const w = neighbors[k]
        if (dist[w] < 0) { dist[w] = dist[v] + 1; queue.push(w) }
        if (dist[w] === dist[v] + 1) { sigma[w] = (sigma[w] || 0) + sigma[v]; pred[w].push(v) }
      }
    }
    const delta = {}
    nodeIds.forEach(v => delta[v] = 0)
    while (stack.length) {
      const w = stack.pop()
      for (let pi = 0; pi < pred[w].length; pi++) {
        const v = pred[w][pi]
        delta[v] += (sigma[v] / (sigma[w] || 1)) * (1 + delta[w])
      }
      if (w !== s) betweenness[w] += delta[w]
    }
  }
  return betweenness
}

function timeIt(fn) {
  const t0 = process.hrtime.bigint()
  const res = fn()
  const t1 = process.hrtime.bigint()
  const ms = Number(t1 - t0) / 1e6
  return { res, ms }
}

function runBenchmark() {
  const sizes = [100, 500, 1000, 2000]
  const avgDegree = 6
  const sampleSizes = [20, 60, 120]
  const strategies = ['full', 'random', 'high-degree']

  const results = []
  for (const n of sizes) {
    console.log(`\nGenerating graph n=${n} avgDeg=${avgDegree}...`)
    const g = generateGraph(n, avgDegree)
    console.log(`Nodes=${g.nodes.length} Links=${g.links.length}`)
    // exact
    const exact = timeIt(() => computeBetweenness(g.nodes, g.links, { strategy: 'full' }))
    console.log(`Exact betweenness time: ${exact.ms.toFixed(1)} ms`)
    results.push({ n, type: 'full', time: exact.ms })
    // sampled
    for (const s of sampleSizes) {
      for (const strat of ['random', 'high-degree']) {
        const t = timeIt(() => computeBetweenness(g.nodes, g.links, { strategy: strat, sampleSize: s }))
        console.log(`Sample strategy=${strat} sample=${s} -> ${t.ms.toFixed(1)} ms`)
        results.push({ n, type: `sample-${strat}-${s}`, time: t.ms })
      }
    }
  }
  console.log('\nSummary:')
  console.table(results)
}

runBenchmark()
