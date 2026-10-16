import DukoGame from './DukoGame'
import { levels } from '../levels'

// 新游戏在这里登记入口信息和组件。
export const games = [
  {
    id: 'duko',
    name: 'Duko',
    subtitle: '彩色找旗',
    description: '每行、每列、每种颜色，恰好一面旗子。在彩色花园中寻找唯一的答案。',
    category: '逻辑推理',
    detail: `${levels.length} 个关卡 · 5 × 5 起步`,
    component: DukoGame,
  },
]
