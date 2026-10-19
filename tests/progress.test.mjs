import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import ts from 'typescript'

// Execute the real TypeScript storage module without adding a test dependency.
const source = fs.readFileSync(new URL('../src/services/progress.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { PROGRESS_KEY, levelSignature, readProgress, saveProgress } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
const level = { id: 'level-1', name: '测试', difficulty: '入门', size: 2, regions: [[0, 1], [1, 1]] }
function storage(initial) {
  const items = new Map(initial === undefined ? [] : [[PROGRESS_KEY, initial]])
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) }
}

test('completion survives a reload and repeat saves do not duplicate progress', () => {
  const local = storage()
  assert.deepEqual(readProgress([level], local), {})
  const completed = { [level.id]: levelSignature(level) }
  assert.equal(saveProgress(completed, local), true)
  assert.deepEqual(readProgress([level], local), completed)
  assert.equal(saveProgress({ ...readProgress([level], local), ...completed }, local), true)
  assert.equal(Object.keys(readProgress([level], local)).length, 1)
})

test('renaming or reordering levels preserves completion; replacing the board invalidates it', () => {
  const local = storage()
  const second = { ...level, id: 'level-2' }
  saveProgress({ [level.id]: levelSignature(level), [second.id]: levelSignature(second) }, local)
  assert.equal(Object.keys(readProgress([second, { ...level, name: '新名称' }], local)).length, 2)
  assert.deepEqual(readProgress([{ ...level, regions: [[1, 0], [1, 1]] }], local), {})
  assert.deepEqual(readProgress([{ ...level, size: 3 }], local), {})
  assert.deepEqual(readProgress([], local), {})
})

test('missing, corrupt, unsupported and malformed storage is safely ignored', () => {
  for (const raw of [undefined, '{bad', 'null', '[]', '3', '{"version":2,"completed":{}}', '{"version":1,"completed":null}', '{"version":1,"completed":{"level-1":true}}']) {
    assert.deepEqual(readProgress([level], storage(raw)), {})
  }
})

test('denied storage access and quota errors do not crash the game', () => {
  const denied = { getItem() { throw Error('denied') }, setItem() { throw Error('quota exceeded') } }
  assert.deepEqual(readProgress([level], denied), {})
  assert.equal(saveProgress({ [level.id]: levelSignature(level) }, denied), false)
  // Node has no window: the default browser-storage accessor must still be safe.
  assert.deepEqual(readProgress([level]), {})
  assert.equal(saveProgress({}), false)
})
