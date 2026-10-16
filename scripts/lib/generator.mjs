import { inspectRegions, neighbors, solveRegions } from './puzzle.mjs'

export function createRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(values, random) {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[values[i], values[j]] = [values[j], values[i]]
  }
  return values
}

export function hasObviousPattern(solution) {
  const n = solution.length
  // Reject three consecutive flags on a diagonal and almost complete main diagonals.
  for (let r = 2; r < n; r++) {
    const step = solution[r] - solution[r - 1]
    if (Math.abs(step) === 1 && solution[r - 1] - solution[r - 2] === step) return true
  }
  return solution.filter((col, row) => col === row).length >= n - 1
    || solution.filter((col, row) => col === n - row - 1).length >= n - 1
}

function growRegions(solution, random) {
  const n = solution.length
  const cells = Array(n * n).fill(-1)
  const frontier = solution.map((col, row) => {
    const cell = row * n + col
    cells[cell] = row
    return new Set(neighbors(cell, n))
  })
  // Different growth rates allow small clue regions as well as larger regions.
  const weights = solution.map(() => Math.exp(random() * 6))
  for (let remaining = n * n - n; remaining > 0; remaining--) {
    const active = frontier.map((set, color) => {
      for (const cell of set) if (cells[cell] !== -1) set.delete(cell)
      return set.size ? color : -1
    }).filter(color => color !== -1)
    let pick = random() * active.reduce((sum, color) => sum + weights[color], 0)
    const color = active.find(color => { pick -= weights[color]; return pick < 0 }) ?? active.at(-1)
    const choices = [...frontier[color]]
    const cell = choices[Math.floor(random() * choices.length)]
    cells[cell] = color
    frontier[color].delete(cell)
    for (const next of neighbors(cell, n)) if (cells[next] === -1) frontier[color].add(next)
  }
  return Array.from({ length: n }, (_, r) => cells.slice(r * n, (r + 1) * n))
}

// Equivalent rotations, reflections and color renamings share one key.
export function canonicalKey(regions) {
  const n = regions.length
  const keys = []
  let grid = regions
  for (let turn = 0; turn < 4; turn++) {
    for (const mirrored of [false, true]) {
      const ids = new Map()
      const values = []
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const color = grid[r][mirrored ? n - c - 1 : c]
        if (!ids.has(color)) ids.set(color, ids.size)
        values.push(ids.get(color))
      }
      keys.push(values.join(','))
    }
    grid = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => grid[n - 1 - c][r]))
  }
  return n + ':' + keys.sort()[0]
}

export function generateLevels({ size = 5, count = 4, seed = 20261016, maxAttempts = 100000 } = {}) {
  if (!Number.isInteger(size) || size < 4 || size > 7) throw Error('size must be an integer from 4 to 7 (current game palette)')
  if (!Number.isInteger(count) || count < 1 || count > 100) throw Error('count must be an integer from 1 to 100')
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('seed must be an unsigned 32-bit integer')
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 1000000) throw Error('maxAttempts must be an integer from 1 to 1000000')
  const random = createRandom(seed)
  const levels = [], reports = [], keys = new Set()
  const rejected = { pattern: 0, geometry: 0, multipleSolutions: 0, duplicate: 0 }
  let attempts = 0
  while (levels.length < count && attempts < maxAttempts) {
    attempts++
    const solution = shuffle(Array.from({ length: size }, (_, i) => i), random)
    if (hasObviousPattern(solution)) { rejected.pattern++; continue }
    const regions = growRegions(solution, random)
    const level = { id: `generated-${seed}-${size}-${levels.length + 1}`, name: `候选 ${levels.length + 1}`, difficulty: '未评级', size, regions }
    const areas = inspectRegions(level)
    if (areas.filter(area => area === 1).length > 2 || Math.max(...areas) > Math.floor(size * size * 0.65)) {
      rejected.geometry++; continue
    }
    const result = solveRegions(regions)
    if (result.count !== 1) { rejected.multipleSolutions++; continue }
    if (!result.solution.every((col, row) => col === solution[row])) throw Error('Generator/solver mismatch')
    const key = canonicalKey(regions)
    if (keys.has(key)) { rejected.duplicate++; continue }
    keys.add(key)
    levels.push(level)
    reports.push({ id: level.id, solution, regionAreas: areas, searchNodes: result.nodes })
  }
  if (levels.length < count) throw Error(`Attempt limit reached (${attempts}); found ${levels.length}/${count}. Increase --max-attempts or change --seed. No output was written.`)
  return { levels, report: { seed, size, count, attempts, rejected, levels: reports } }
}
