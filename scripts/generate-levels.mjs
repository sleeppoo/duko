import fs from 'node:fs'
import path from 'node:path'
import { generateLevels } from './lib/generator.mjs'

const help = `离线关卡生成器
npm run generate:levels -- --size 5 --count 4 --seed 20261016

选项：
  --size N            棋盘尺寸 4–7，默认 5
  --count N           候选关卡数量 1–100，默认 4
  --seed N            随机种子 0–4294967295，默认 20261016
  --max-attempts N    最大尝试次数，默认 100000，最多 1000000
  --output PATH       输出目录，默认 generated/seed-SEED-size-N
  --help              显示帮助

输出 levels.json（可导入的关卡）与 report.json（答案和筛选统计）。
仅输出离线候选关卡，不修改游戏现有关卡；已有输出文件不会覆盖。`

try {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    console.log(help)
  } else {
    const options = {}
    let output
    const flags = new Map([['--size', 'size'], ['--count', 'count'], ['--seed', 'seed'], ['--max-attempts', 'maxAttempts']])
    const seen = new Set()
    for (let i = 0; i < args.length; i += 2) {
      const flag = args[i], value = args[i + 1]
      if (seen.has(flag)) throw Error('Duplicate option: ' + flag)
      seen.add(flag)
      if (!flags.has(flag) && flag !== '--output') throw Error('Unknown option: ' + flag)
      if (!value || value.startsWith('--')) throw Error('Missing value for ' + flag)
      if (flag === '--output') output = value
      else {
        if (!/^\d+$/.test(value)) throw Error('Expected an integer for ' + flag)
        options[flags.get(flag)] = Number(value)
      }
    }
    const directory = path.resolve(output ?? `generated/seed-${options.seed ?? 20261016}-size-${options.size ?? 5}`)
    const levelsPath = path.join(directory, 'levels.json')
    const reportPath = path.join(directory, 'report.json')
    if (fs.existsSync(levelsPath) || fs.existsSync(reportPath)) throw Error('Output already exists. Choose a new --output directory.')
    const { levels, report } = generateLevels(options)
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(levelsPath, JSON.stringify(levels, null, 2) + '\n', { flag: 'wx' })
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
    console.log(`Generated ${levels.length} unique-solution levels in ${report.attempts} attempts.`)
    console.log('Levels: ' + levelsPath)
    console.log('Answers and statistics: ' + reportPath)
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
