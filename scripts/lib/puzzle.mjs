// Rules: one flag per row, column and region. Diagonal adjacency is allowed.
export function inspectRegions(level) {
  const { size: n, regions } = level ?? {}
  if (!Number.isInteger(n) || n < 1 || n > 12 || !Array.isArray(regions) || regions.length !== n
    || regions.some(row => !Array.isArray(row) || row.length !== n || row.some(v => !Number.isInteger(v) || v < 0 || v >= n))) {
    throw Error('Invalid grid: expected an N × N matrix with region IDs 0 to N-1 (N <= 12)')
  }
  const areas = []
  for (let color = 0; color < n; color++) {
    const cells = regions.flatMap((row, r) => row.flatMap((v, c) => v === color ? [r * n + c] : []))
    if (!cells.length) throw Error('Missing region ' + color)
    const seen = new Set([cells[0]])
    const queue = [cells[0]]
    for (const cell of queue) {
      for (const next of neighbors(cell, n)) {
        if (regions[Math.floor(next / n)][next % n] === color && !seen.has(next)) {
          seen.add(next)
          queue.push(next)
        }
      }
    }
    if (seen.size !== cells.length) throw Error('Disconnected region ' + color)
    areas.push(cells.length)
  }
  return areas
}

export function neighbors(cell, n) {
  const r = Math.floor(cell / n), c = cell % n
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
    .filter(([rr, cc]) => rr >= 0 && rr < n && cc >= 0 && cc < n)
    .map(([rr, cc]) => rr * n + cc)
}

// Stops at the second solution by default; never compares to a hidden answer.
export function solveRegions(regions, limit = 2) {
  const n = regions.length
  let count = 0, nodes = 0, firstSolution = null
  const placement = Array(n).fill(-1)
  function search(row, columns, colors) {
    if (count >= limit) return
    nodes++
    if (row === n) {
      count++
      firstSolution ??= [...placement]
      return
    }
    for (let col = 0; col < n; col++) {
      const color = regions[row][col]
      if (!(columns & (1 << col)) && !(colors & (1 << color))) {
        placement[row] = col
        search(row + 1, columns | (1 << col), colors | (1 << color))
      }
    }
  }
  search(0, 0, 0)
  return { count, solution: firstSolution, nodes }
}
