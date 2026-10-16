import { games } from '../games'

export default function HomePage() {
  return (
    <main className="lobby-shell">
      <header className="page-header">
        <a className="brand" href="#/">小小游乐场<span className="brand-dot">.</span></a>
        <span className="header-note">给日常留一点好玩的时间</span>
      </header>
      <section className="lobby-intro" aria-labelledby="lobby-title">
        <span className="lobby-eyebrow">休息一下，玩一会儿</span>
        <h1 id="lobby-title">今天，想玩点什么？</h1>
        <p>挑一个小游戏，让思绪换个方向。</p>
      </section>
      <section aria-labelledby="games-title">
        <div className="lobby-section-heading"><h2 id="games-title">游戏收藏</h2><span>{games.length} 款游戏</span></div>
        <div className="game-catalog">
          {games.map(game => (
            <a className="game-entry" key={game.id} href={'#/' + game.id} aria-label={'进入 ' + game.name + ' ' + game.subtitle}>
              <div className="game-preview" aria-hidden="true">
                <div className="preview-board">
                  {Array.from({ length: 25 }, (_, index) => {
                    const row = Math.floor(index / 5)
                    const col = index % 5
                    return <span key={index} className={'region-' + Math.max(row, col)}>{row === col ? '⚑' : ''}</span>
                  })}
                </div>
                <span className="preview-badge">{game.category}</span>
              </div>
              <div className="game-entry-body">
                <div className="game-entry-heading"><h3>{game.name}</h3><span>{game.subtitle}</span></div>
                <p>{game.description}</p>
                <div className="game-entry-bottom"><span>{game.detail}</span><strong>开始游戏 <span aria-hidden="true">↗</span></strong></div>
              </div>
            </a>
          ))}
          <div className="coming-soon">
            <span className="coming-soon-symbol" aria-hidden="true">✧</span>
            <h3>下一份快乐，待续</h3>
            <p>更多小游戏会陆续加入这里。</p>
          </div>
        </div>
      </section>
      <footer className="page-footer lobby-footer">无需下载，点开就玩。</footer>
    </main>
  )
}
