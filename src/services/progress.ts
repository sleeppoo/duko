import type { Level } from '../levels'

export const PROGRESS_KEY = 'duko.progress.v1'
export type CompletedLevels = Record<string, string>
type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>

function browserStorage(): ProgressStorage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

// Use the exact board contents so replacing a puzzle invalidates its old completion.
export function levelSignature(level: Level): string {
  return JSON.stringify([level.size, level.regions])
}

export function readProgress(levels: Level[], storage = browserStorage()): CompletedLevels {
  try {
    const data: unknown = JSON.parse(storage?.getItem(PROGRESS_KEY) ?? 'null')
    if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1
      || !('completed' in data) || !data.completed || typeof data.completed !== 'object') return {}
    const completed = data.completed
    return Object.fromEntries(levels
      .filter(level => Object.hasOwn(completed, level.id)
        && (completed as CompletedLevels)[level.id] === levelSignature(level))
      .map(level => [level.id, levelSignature(level)]))
  } catch {
    return {}
  }
}

export function saveProgress(completed: CompletedLevels, storage = browserStorage()): boolean {
  try {
    if (!storage) return false
    storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, completed }))
    return true
  } catch {
    return false
  }
}
