import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { canonicalKey, generateLevels, hasObviousPattern } from '../scripts/lib/generator.mjs'
import { inspectRegions, solveRegions } from '../scripts/lib/puzzle.mjs'

// Independent exhaustive permutation check, without solver bitmasks or early exit.
function bruteForce(regions) {
  const n = regions.length, solutions = []
  function visit(columns) {
    if (columns.length === n) {
      if (new Set(columns.map((col, row) => regions[row][col])).size === n) solutions.push(columns)
      return
    }
    for (let col = 0; col < n; col++) if (!columns.includes(col)) visit([...columns, col])
  }
  visit([])
  return solutions
}

test('generated boards have connected regions, one verified solution and varied layouts', () => {
  for (const size of [4, 5, 6, 7]) {
    for (const seed of [0, 42, 20261016]) {
      const result = generateLevels({ size, count: 4, seed })
      const keys = new Set()
      for (const [index, level] of result.levels.entries()) {
        const areas = inspectRegions(level)
        assert.equal(areas.length, size)
        assert.ok(areas.filter(area => area === 1).length <= 2)
        assert.ok(Math.max(...areas) <= Math.floor(size * size * .65))
        const solutions = bruteForce(level.regions)
        assert.equal(solutions.length, 1)
        assert.deepEqual(solutions[0], result.report.levels[index].solution)
        assert.equal(hasObviousPattern(solutions[0]), false)
        keys.add(canonicalKey(level.regions))
      }
      assert.equal(keys.size, 4)
    }
  }
})

test('same seed and options reproduce levels and report exactly', () => {
  const options = { size: 6, count: 3, seed: 99 }
  assert.deepEqual(generateLevels(options), generateLevels(options))
  assert.notDeepEqual(generateLevels(options).levels, generateLevels({ ...options, seed: 100 }).levels)
})

test('solver distinguishes zero, unique, multiple solutions; diagonal adjacency is allowed', () => {
  assert.equal(solveRegions([[0, 0], [0, 0]]).count, 0)
  const unique = [[0, 1], [1, 1]]
  assert.equal(solveRegions(unique).count, 1)
  assert.deepEqual(solveRegions(unique).solution, [0, 1])
  assert.equal(solveRegions([[0, 0], [1, 1]]).count, 2)
})

test('shape and connectivity checks reject invalid levels', () => {
  for (const level of [
    { size: 0, regions: [] },
    { size: 2, regions: [[0], [1]] },
    { size: 2, regions: [[0, 2], [1, 1]] },
    { size: 2, regions: [[0, 0], [0, 0]] },
    { size: 2, regions: [[0, 1], [1, 0]] },
  ]) assert.throws(() => inspectRegions(level))
})

test('pattern filter and symmetry key handle diagonals and renamed mirror boards', () => {
  assert.equal(hasObviousPattern([0, 1, 2, 3, 4]), true)
  assert.equal(hasObviousPattern([4, 3, 2, 1, 0]), true)
  assert.equal(hasObviousPattern([2, 3, 4, 0, 1]), true)
  assert.equal(hasObviousPattern([1, 3, 0, 4, 2]), false)
  const grid = [[0, 1, 2], [1, 1, 2], [2, 2, 2]]
  const mirror = grid.map(row => [...row].reverse().map(color => 2 - color))
  assert.equal(canonicalKey(grid), canonicalKey(mirror))
})

test('options and attempt budget fail explicitly', () => {
  for (const options of [{ size: 3 }, { size: 8 }, { count: 0 }, { count: 1.5 }, { seed: -1 }, { seed: 2 ** 32 }, { maxAttempts: 0 }]) {
    assert.throws(() => generateLevels(options))
  }
  assert.throws(() => generateLevels({ count: 4, maxAttempts: 1 }), /Attempt limit/)
})

test('CLI writes compatible files, refuses overwrite and does not alter published levels', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'duko-generator-test-'))
  const cli = fileURLToPath(new URL('../scripts/generate-levels.mjs', import.meta.url))
  const published = fileURLToPath(new URL('../src/levels/levels.json', import.meta.url))
  const before = fs.readFileSync(published, 'utf8')
  const run = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' })
  try {
    const args = ['--size', '5', '--count', '2', '--seed', '123', '--output', directory]
    assert.equal(run(args).status, 0)
    const levelsFile = path.join(directory, 'levels.json')
    const content = fs.readFileSync(levelsFile, 'utf8')
    assert.equal(JSON.parse(content).length, 2)
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'report.json'), 'utf8')).count, 2)
    assert.equal(run(args).status, 1)
    assert.equal(fs.readFileSync(levelsFile, 'utf8'), content)
    for (const badArgs of [['--size', '-1'], ['--seed'], ['--unknown', '1'], ['--count', '2', '--count', '3']]) {
      assert.equal(run(badArgs).status, 1)
    }
    const failedOutput = path.join(directory, 'failed')
    assert.equal(run(['--count', '4', '--max-attempts', '1', '--output', failedOutput]).status, 1)
    assert.equal(fs.existsSync(failedOutput), false)
    assert.equal(fs.readFileSync(published, 'utf8'), before)
  } finally {
    // Only remove the exact temporary directory created above.
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
    assert.ok(path.basename(directory).startsWith('duko-generator-test-'))
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
