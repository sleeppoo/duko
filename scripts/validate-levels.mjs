import fs from 'node:fs'

export function validateLevel(level) {
  const { size: n, regions } = level
  if (regions.length !== n || regions.some(row => row.length !== n || row.some(v => !Number.isInteger(v) || v < 0 || v >= n))) throw Error(`${level.id}: invalid grid`)
  for (let color = 0; color < n; color++) {
    const cells = regions.flatMap((row, r) => row.flatMap((v, c) => v === color ? [r * n + c] : []))
    if (!cells.length) throw Error(`${level.id}: missing region`)
    const seen = new Set([cells[0]])
    const queue = [cells[0]]
    for (const cell of queue) {
      const r = Math.floor(cell / n), c = cell % n
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const rr = r + dr, cc = c + dc, next = rr * n + cc
        if (rr >= 0 && rr < n && cc >= 0 && cc < n && regions[rr][cc] === color && !seen.has(next)) { seen.add(next); queue.push(next) }
      }
    }
    if (seen.size !== cells.length) throw Error(`${level.id}: disconnected region`)
  }
  let solutions = 0
  function search(row, columns, colors) {
    if (solutions > 1) return
    if (row === n) { solutions++; return }
    for (let c = 0; c < n; c++) {
      const color = regions[row][c]
      if (!(columns & (1 << c)) && !(colors & (1 << color))) search(row + 1, columns | (1 << c), colors | (1 << color))
    }
  }
  search(0, 0, 0)
  if (solutions !== 1) throw Error(`${level.id}: expected one solution, got ${solutions}`)
}

if (process.argv[1]?.endsWith('validate-levels.mjs')) {
  const levels = JSON.parse(fs.readFileSync(new URL('../src/levels/levels.json', import.meta.url), 'utf8'))
  for (const level of levels) { validateLevel(level); console.log(`${level.id}: connected regions, exactly one solution (${level.size} × ${level.size})`) }
}
