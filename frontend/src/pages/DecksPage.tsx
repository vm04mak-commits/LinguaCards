import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/api'

interface Deck {
  id: number
  title: string
  description: string
  emoji: string
  cards_count: number
  category: string
  difficulty: string
  is_subscribed?: boolean
  progress_percentage?: number
  total_cards_studied?: number
  cards_known?: number
  cards_repeat?: number
  cards_new?: number
}

const DecksPage = () => {
  const navigate = useNavigate()
  const [decks, setDecks] = useState<Deck[]>([])
  const [myDecks, setMyDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ready' | 'my'>('ready')
  const [subscribingId, setSubscribingId] = useState<number | null>(null)

  useEffect(() => {
    loadAllDecks()
  }, [])

  const loadAllDecks = async () => {
    try {
      // Load both decks and myDecks in parallel
      const [decksResponse, myDecksResponse] = await Promise.all([
        apiClient.getDecks(),
        apiClient.getMyDecks(),
      ])
      setDecks(decksResponse.data)
      setMyDecks(myDecksResponse.data.data || [])
    } catch (err) {
      console.error('Error loading decks:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMyDecks = async () => {
    try {
      const response = await apiClient.getMyDecks()
      setMyDecks(response.data.data || [])
    } catch (err) {
      console.error('Error loading my decks:', err)
    }
  }

  const handleSubscribe = async (deckId: number) => {
    setSubscribingId(deckId)
    try {
      await apiClient.subscribeToDeck(deckId)
      // Update local state
      setDecks(decks.map(d =>
        d.id === deckId ? { ...d, is_subscribed: true } : d
      ))
    } catch (err) {
      console.error('Error subscribing:', err)
    } finally {
      setSubscribingId(null)
    }
  }

  const handleUnsubscribe = async (deckId: number) => {
    setSubscribingId(deckId)
    try {
      await apiClient.unsubscribeFromDeck(deckId)
      // Update local state
      setDecks(decks.map(d =>
        d.id === deckId ? { ...d, is_subscribed: false } : d
      ))
      setMyDecks(myDecks.filter(d => d.id !== deckId))
    } catch (err) {
      console.error('Error unsubscribing:', err)
    } finally {
      setSubscribingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const handleDeckClick = (deck: Deck) => {
    // Only navigate if subscribed (in "my" tab) or in "ready" tab and subscribed
    if (deck.is_subscribed || activeTab === 'my') {
      navigate(`/decks/${deck.id}`)
    }
  }

  const renderDeckCard = (deck: Deck, showUnsubscribe = false) => (
    <div
      key={deck.id}
      className="bg-white rounded-3xl p-5 shadow-sm"
    >
      <div
        className={`flex items-start gap-4 mb-4 ${(deck.is_subscribed || showUnsubscribe) ? 'cursor-pointer' : ''}`}
        onClick={() => (deck.is_subscribed || showUnsubscribe) && handleDeckClick(deck)}
      >
        <div className="w-20 h-20 flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center text-4xl">
            {deck.emoji || '📚'}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg mb-1">
            {deck.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {deck.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
              {deck.difficulty || 'Начальный'}
            </span>
            <span className="text-gray-600 text-sm">
              <span className="font-semibold">{deck.cards_count}</span> Карточек
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full bg-purple-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${deck.progress_percentage || 0}%` }}
          />
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-700">Знаю</span>
            <span className="text-green-600 font-medium">{deck.cards_known || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-gray-700">Учу</span>
            <span className="text-yellow-600 font-medium">{deck.cards_repeat || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <span className="text-gray-700">Новые</span>
            <span className="text-gray-500 font-medium">{deck.cards_new || 0}</span>
          </div>
        </div>
        <span className="text-sm text-gray-600">
          {Math.round(deck.progress_percentage || 0)}%
        </span>
      </div>

      {/* Action button */}
      {showUnsubscribe ? (
        <button
          onClick={() => handleUnsubscribe(deck.id)}
          disabled={subscribingId === deck.id}
          className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {subscribingId === deck.id ? 'Отписываюсь...' : 'Отписаться'}
        </button>
      ) : deck.is_subscribed ? (
        <div className="flex items-center justify-center gap-2 py-2 text-green-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium text-sm">Добавлено</span>
        </div>
      ) : (
        <button
          onClick={() => handleSubscribe(deck.id)}
          disabled={subscribingId === deck.id}
          className="w-full py-2 px-4 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {subscribingId === deck.id ? 'Добавляю...' : 'Добавить набор'}
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Темы</h1>
        <p className="text-gray-600 text-sm">Выберите набор для изучения</p>
      </div>

      {/* Tabs */}
      <div className="bg-purple-200 px-4 py-4">
        <div className="flex gap-2 bg-purple-200 rounded-full p-1">
          <button
            onClick={() => setActiveTab('ready')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'ready'
                ? 'bg-white text-gray-900'
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            Готовые наборы
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'my'
                ? 'bg-white text-gray-900'
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            Мои наборы ({myDecks.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {activeTab === 'ready' ? (
          <>
            {decks.map((deck) => renderDeckCard(deck))}
          </>
        ) : (
          <>
            {myDecks.length > 0 ? (
              myDecks.map((deck) => renderDeckCard(deck, true))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-5xl mb-4">📚</div>
                <p className="text-gray-500 mb-2">У вас пока нет добавленных наборов</p>
                <p className="text-gray-400 text-sm">Перейдите в "Готовые наборы" и добавьте интересующие темы</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating add button (for creating custom decks) */}
      {activeTab === 'my' && (
        <button
          onClick={() => navigate('/decks/create')}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export default DecksPage
