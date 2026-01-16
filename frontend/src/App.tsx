import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTelegram } from './hooks/useTelegram'
import HomePage from './pages/HomePage'
import DecksPage from './pages/DecksPage'
import DeckDetailPage from './pages/DeckDetailPage'
import MyCardsPage from './pages/MyCardsPage'
import CreateDeckPage from './pages/CreateDeckPage'
import Layout from './components/Layout'

function App() {
  const { tg, user } = useTelegram()

  useEffect(() => {
    // Expand app to full height
    tg?.expand()

    // Enable closing confirmation
    tg?.enableClosingConfirmation()

    // Set header color
    tg?.setHeaderColor('#8B5CF6')
  }, [tg])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            LinguaCards
          </h1>
          <p className="text-gray-600">
            Откройте через Telegram бота
          </p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="decks" element={<DecksPage />} />
          <Route path="decks/create" element={<CreateDeckPage />} />
          <Route path="decks/:id" element={<DeckDetailPage />} />
          <Route path="my-cards" element={<MyCardsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
