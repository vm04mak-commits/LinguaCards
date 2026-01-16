import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
}

interface Card {
  id: number
  ru_text: string
  en_text: string
}

interface DeckStats {
  total: number
  new: number
  repeat: number
  known: number
}

const DeckDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [stats, setStats] = useState<DeckStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      loadDeckData(parseInt(id))
    }
  }, [id])

  const loadDeckData = async (deckId: number) => {
    try {
      setLoading(true)
      const [deckResponse, cardsResponse, statsResponse] = await Promise.all([
        apiClient.getDeck(deckId),
        apiClient.getCards(deckId),
        apiClient.getDeckStats(deckId),
      ])
      setDeck(deckResponse.data)
      setCards(cardsResponse.data.data || cardsResponse.data || [])
      setStats(statsResponse.data)
    } catch (err) {
      console.error('Error loading deck:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartStudy = () => {
    // Clear session storage to force fresh cards from this deck
    sessionStorage.removeItem('linguacards_cards')
    sessionStorage.removeItem('linguacards_index')
    sessionStorage.removeItem('linguacards_stats')
    // Store selected deck ID
    sessionStorage.setItem('linguacards_selected_deck', id || '1')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Набор не найден</p>
      </div>
    )
  }

  const hasStudied = stats && (stats.known > 0 || stats.repeat > 0)

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Назад</span>
        </button>

        {/* Deck info */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center text-4xl">
              {deck.emoji || '📚'}
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{deck.title}</h1>
            <p className="text-gray-600 text-sm mb-2">{deck.description}</p>
            <div className="flex items-center gap-2">
              <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                {deck.difficulty || 'Начальный'}
              </span>
              <span className="text-gray-600 text-sm">
                {deck.cards_count} карточек
              </span>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-100 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
              <div className="text-3xl font-bold text-green-600">{stats.known}</div>
              <div className="text-xs text-green-700 mt-1">Знаю</div>
            </div>
            <div className="bg-yellow-100 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
              <div className="text-3xl font-bold text-yellow-600">{stats.repeat}</div>
              <div className="text-xs text-yellow-700 mt-1">Повторить</div>
            </div>
            <div className="bg-blue-100 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
              <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
              <div className="text-xs text-blue-700 mt-1">Новые</div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {stats && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Прогресс</span>
              <span>{stats.total > 0 ? Math.round((stats.known / stats.total) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.known / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Cards list */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Карточки ({cards.length})</h2>
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
            >
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{card.ru_text}</h3>
                  {expandedCard === card.id && (
                    <p className="text-gray-500 mt-2">{card.en_text}</p>
                  )}
                </div>
                <button className="text-gray-400 ml-2">
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedCard === card.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-white via-white to-transparent pt-6">
        <button
          onClick={handleStartStudy}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-primary/90 transition-colors"
        >
          {hasStudied ? 'Продолжить изучение' : 'Начать изучение'}
        </button>
      </div>
    </div>
  )
}

export default DeckDetailPage
