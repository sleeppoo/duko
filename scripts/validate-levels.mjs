import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { inspectRegions, solveRegions } from './lib/puzzle.mjs'

export function validateLevel(level) {
  inspectRegions(level)
  const result = solveRegions(level.regions)
  if (result.count !== 1) throw Error(`${level.id}: expected one solution, got ${result.count}${result.count === 2 ? '+' : ''}`)
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const levels = JSON.parse(fs.readFileSync(new URL('../src/levels/levels.json', import.meta.url), 'utf8'))
  for (const level of levels) {
    validateLevel(level)
    console.log(`${level.id}: connected regions, exactly one solution (${level.size} × ${level.size})`)
  }
}
