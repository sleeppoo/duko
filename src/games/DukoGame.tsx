import { useState } from 'react'
import { levels } from '../levels'

type Mark = 'empty' | 'flag' | 'excluded'
const names = ['蜜桃', '奶黄', '薄荷', '薰衣草', '天空', '杏橙', '玫瑰']
const emptyBoard = (size: number): Mark[] => Array<Mark>(size * size).fill('empty')

function DukoGame() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [levelIndex, setLevelIndex] = useState(0)
  const level = levels[levelIndex]
  const { size, regions } = level
  const [marks, setMarks] = useState<Mark[]>(() => emptyBoard(levels[0].size))
  const [history, setHistory] = useState<Mark[][]>([])
  const flags = marks.flatMap((mark, index) => mark === 'flag' ? [index] : [])
  const [checkResult, setCheckResult] = useState<{ conflicts: number[]; won: boolean; message: string } | null>(null)
  const conflicts = new Set(checkResult?.conflicts ?? [])
  const won = checkResult?.won ?? false

  function checkAnswer() {
    const invalid = flags.filter(index => flags.some(other =>
    other !== index && (Math.floor(index / size) === Math.floor(other / size)
      || index % size === other % size
      || regions[Math.floor(index / size)][index % size] === regions[Math.floor(other / size)][other % size])
    ))
    const complete = flags.length === size && invalid.length === 0
    const message = complete
      ? '漂亮！所有旗子都找到了，关卡完成。'
      : invalid.length > 0
        ? '红框中的旗子在同一行、列或颜色区域，请调整后重新检查。'
        : flags.length < size
          ? '旗子还没放齐，需要放置 ' + size + ' 面旗子，当前有 ' + flags.length + ' 面。'
          : '旗子数量过多，请调整后重新检查。'
    setCheckResult({ conflicts: invalid, won: complete, message })
  }

  function changeCell(index: number, target: 'flag' | 'excluded') {
    setCheckResult(null)
    setHistory(previous => [...previous, marks])
    setMarks(previous => previous.map((mark, position) => position === index ? (mark === target ? 'empty' : target) : mark))
  }

  function selectLevel(index: number) {
    if (index < 0 || index >= levels.length) return
    setCheckResult(null)
    setLevelIndex(index)
    setMarks(emptyBoard(levels[index].size))
    setHistory([])
  }

  function undo() {
    const previous = history.at(-1)
    if (!previous) return
    setCheckResult(null)
    setMarks(previous)
    setHistory(current => current.slice(0, -1))
  }

  function reset() {
    setCheckResult(null)
    setHistory(previous => [...previous, marks])
    setMarks(emptyBoard(size))
  }

  return (
    <main className="game-shell">
      <header className="page-header">
        <div className="header-start">
          <button className="sidebar-toggle" type="button" aria-expanded={sidebarOpen}
            aria-controls="level-sidebar" onClick={() => setSidebarOpen(open => !open)}>
            <span aria-hidden="true">☰</span> {sidebarOpen ? '收起关卡' : '展开关卡'}
          </button>
        <a className="brand" href="#/duko"><span aria-hidden="true">⚑</span> duko<span className="brand-dot">.</span></a>
        </div>
        <a className="back-home" href="#/">← 返回大厅</a>
      </header>
      <div className={'game-layout' + (sidebarOpen ? ' sidebar-open' : '')}>
        <aside id="level-sidebar" className="level-sidebar" hidden={!sidebarOpen} aria-label="关卡侧边栏">
          <div className="sidebar-heading"><h2>选择关卡</h2><span>{levels.length} 个</span></div>
          <nav className="level-selector" aria-label="选择关卡">
            {levels.map((item, index) => (
              <button key={item.id} type="button" aria-current={index === levelIndex ? 'step' : undefined}
                aria-label={'第 ' + (index + 1) + ' 关'}
                onClick={() => { if (index !== levelIndex) selectLevel(index) }}>
                {index + 1}
              </button>
            ))}
          </nav>
        </aside>
      <section className="game-card" aria-labelledby="game-title">
        <div className="level-label">{level.difficulty}关卡 {String(levelIndex + 1).padStart(2, '0')}<span>{size} × {size}</span></div>

        <h1 id="game-title">每种颜色，一面旗子。</h1>
        <p className="intro">观察颜色，找到每面旗子独一无二的位置。</p>
        <div className="board-heading"><span>{level.name}</span><span>已插旗 <strong>{flags.length} / {size}</strong></span></div>
        <div className="board" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} aria-label={`${size} 行 ${size} 列棋盘`}>
          {marks.map((mark, index) => {
            const row = Math.floor(index / size)
            const col = index % size
            const region = regions[row][col]
            return (
              <button key={index} type="button"
                className={`cell region-${region}${conflicts.has(index) ? ' conflict' : ''}`}
                aria-label={`第 ${row + 1} 行第 ${col + 1} 列，${names[region]}区域，${mark === 'flag' ? '旗子' : mark === 'excluded' ? '已排除' : '空白'}，左键插旗，右键排除，再次同键点击取消`}
                onClick={() => changeCell(index, 'flag')}
                onContextMenu={event => {
                  event.preventDefault()
                  changeCell(index, 'excluded')
                }}>
                <span className={mark === 'excluded' ? 'excluded-mark' : 'flag-mark'} aria-hidden="true">{mark === 'flag' ? '⚑' : mark === 'excluded' ? '×' : ''}</span>
                <span className="region-number" aria-hidden="true">{region + 1}</span>
              </button>
            )
          })}
        </div>
        <p className={`game-status${won ? ' success' : checkResult ? ' warning' : ''}`} role="status">
          {checkResult?.message ?? '左键插旗 · 右键排除 · 完成后点击检查答案'}
        </p>
        {won && (
          <div className="completion">
            <p>{levelIndex < levels.length - 1 ? '准备好迎接下一片花园了吗？' : '你已完成最后一关！可以选择其他关卡再次挑战。'}</p>
            {levelIndex < levels.length - 1 && (
              <button type="button" onClick={() => selectLevel(levelIndex + 1)}>下一关 →</button>
            )}
          </div>
        )}
        <button className="check-answer" type="button" onClick={checkAnswer}>检查答案</button>
        <div className="toolbar">
          <button type="button" onClick={undo} disabled={history.length === 0}>↶ 撤销一步</button>
          <button type="button" onClick={reset} disabled={marks.every(mark => mark === 'empty')}>↻ 重新开始</button>
        </div>
        <aside className="rules" aria-label="游戏规则">
          <h2>怎么玩</h2>
          <p>每一行、每一列、每一种颜色区域，都恰好放置一面旗子。</p>
          <p>左键插旗，右键用 × 排除，再次同键点击取消。格子角落的数字代表颜色区域。</p>
          <p>插旗完成后，点击“检查答案”查看结果。</p>
        </aside>
      </section>
      </div>
      <footer className="page-footer">慢慢推理，答案就在格子之间。</footer>
    </main>
  )
}

export default DukoGame



