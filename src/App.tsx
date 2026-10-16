import { useEffect, useState } from 'react'
import { games } from './games'
import HomePage from './pages/HomePage'
import './App.css'

function currentGame() {
  return games.find(game => window.location.hash === '#/' + game.id)?.id ?? null
}

export default function App() {
  const [activeGame, setActiveGame] = useState(currentGame)

  useEffect(() => {
    function navigate() {
      setActiveGame(currentGame())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])

  useEffect(() => {
    const game = games.find(item => item.id === activeGame)
    document.title = game ? game.name + ' · 小游戏大厅' : '小游戏大厅'
  }, [activeGame])

  return (
    <>
      {activeGame === null && <HomePage />}
      {games.map(game => {
        const Game = game.component
        // 保留已打开游戏的状态，返回大厅后再次进入可继续。
        return <div key={game.id} hidden={activeGame !== game.id}><Game /></div>
      })}
    </>
  )
}
