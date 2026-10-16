import data from './levels.json'

export interface Level {
  id: string
  name: string
  difficulty: string
  size: number
  regions: number[][]
}

export const levels: Level[] = data
