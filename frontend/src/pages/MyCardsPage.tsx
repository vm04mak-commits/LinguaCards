import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { apiClient } from '../lib/api'

interface Stats {
  total_studied: number
  cards_known: number
  cards_repeat: number
  cards_new: number
  avg_accuracy: number
}

interface CardProgress {
  id: number
  card_id: number
  ru_text: string
  en_text: string
  deck_title?: string
  deck_emoji?: string
  status: 'new' | 'repeat' | 'known'
  repetitions: number
  correct_answers: number
  wrong_answers: number
  current_streak: number
  accuracy_percentage: number
}

type FilterType = 'know' | 'repeat' | 'unknown'

const MyCardsPage = () => {
  const location = useLocation()
  const [stats, setStats] = useState<Stats>({
    total_studied: 0,
    cards_known: 0,
    cards_repeat: 0,
    cards_new: 0,
    avg_accuracy: 0,
  })
  const [cards, setCards] = useState<CardProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('know')
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // Always load progress from ALL subscribed decks
      const progressResponse = await apiClient.getAllDecksProgress()
      const loadedCards = progressResponse.data.data || []
      setCards(loadedCards)

      // Calculate stats from loaded cards
      const calculatedStats = {
        total_studied: loadedCards.length,
        cards_known: loadedCards.filter((c: CardProgress) => c.status === 'known').length,
        cards_repeat: loadedCards.filter((c: CardProgress) => c.status === 'repeat').length,
        cards_new: loadedCards.filter((c: CardProgress) => c.status === 'new').length,
        avg_accuracy: 0,
      }
      setStats(calculatedStats)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Reload data when navigating to this page
  useEffect(() => {
    loadData()
  }, [location.pathname, loadData])

  // Filter cards based on status
  const getFilteredCards = (): CardProgress[] => {
    switch (activeFilter) {
      case 'know':
        return cards.filter(c => c.status === 'known')
      case 'repeat':
        return cards.filter(c => c.status === 'repeat')
      case 'unknown':
        return cards.filter(c => c.status === 'new')
      default:
        return []
    }
  }

  const filteredCards = getFilteredCards()

  const getFilterText = () => {
    switch (activeFilter) {
      case 'know':
        return 'Карточки с точностью 80% и выше'
      case 'repeat':
        return 'Карточки с точностью от 1% до 79%'
      case 'unknown':
        return 'Карточки без правильных ответов'
      default:
        return ''
    }
  }

  const getBackgroundColor = () => {
    switch (activeFilter) {
      case 'know':
        return 'bg-green-50'
      case 'repeat':
        return 'bg-yellow-50'
      case 'unknown':
        return 'bg-red-50'
      default:
        return 'bg-white'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Мои карточки</h1>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-100 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-3xl font-bold text-green-600">
              {stats.cards_known}
            </div>
            <div className="text-xs text-green-700 mt-1">Знаю</div>
          </div>

          <div className="bg-yellow-100 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-3xl font-bold text-yellow-600">
              {stats.cards_repeat}
            </div>
            <div className="text-xs text-yellow-700 mt-1">Повторить</div>
          </div>

          <div className="bg-red-100 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-3xl font-bold text-red-500">
              {stats.cards_new}
            </div>
            <div className="text-xs text-red-600 mt-1">Не знаю</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="grid grid-cols-3 gap-1 bg-gray-200 rounded-full p-1">
          <button
            onClick={() => setActiveFilter('know')}
            className={`py-2 rounded-full text-xs font-medium transition-colors text-center ${
              activeFilter === 'know'
                ? 'bg-white text-gray-900'
                : 'bg-transparent text-gray-600'
            }`}
          >
            <div>Знаю</div>
            <div>({stats.cards_known})</div>
          </button>
          <button
            onClick={() => setActiveFilter('repeat')}
            className={`py-2 rounded-full text-xs font-medium transition-colors text-center ${
              activeFilter === 'repeat'
                ? 'bg-white text-gray-900'
                : 'bg-transparent text-gray-600'
            }`}
          >
            <div>Повторить</div>
            <div>({stats.cards_repeat})</div>
          </button>
          <button
            onClick={() => setActiveFilter('unknown')}
            className={`py-2 rounded-full text-xs font-medium transition-colors text-center ${
              activeFilter === 'unknown'
                ? 'bg-white text-gray-900'
                : 'bg-transparent text-gray-600'
            }`}
          >
            <div>Не знаю</div>
            <div>({stats.cards_new})</div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`px-4 py-4 ${getBackgroundColor()}`}>
        <p className="text-sm text-gray-600 mb-4">{getFilterText()}</p>

        {filteredCards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Нет карточек в этой категории
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCards.map((card) => (
              <div
                key={card.card_id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedCard(expandedCard === card.card_id ? null : card.card_id)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-xl">
                        {card.ru_text}
                      </h3>
                      {/* Show fire icon: for "know" always show streak, for "repeat" show streak 1-4 */}
                      {activeFilter === 'know' && card.current_streak >= 1 && (
                        <span className="text-orange-500 text-lg">🔥{card.current_streak}</span>
                      )}
                      {activeFilter === 'repeat' && card.current_streak >= 1 && card.current_streak <= 4 && (
                        <span className="text-orange-500 text-lg">🔥{card.current_streak}</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-lg mb-3">{card.en_text}</p>
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="border border-gray-300 text-gray-700 px-3 py-1 rounded-full">
                        {card.deck_emoji} {card.deck_title || 'Набор'}
                      </span>
                      <span className="text-gray-600">
                        Попыток: {card.repetitions}
                      </span>
                      <span className="text-gray-600">
                        Точность: {Math.round(card.accuracy_percentage)}%
                      </span>
                    </div>
                  </div>
                  <button className="text-gray-400">
                    <svg
                      className={`w-6 h-6 transition-transform ${
                        expandedCard === card.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Expanded stats */}
                {expandedCard === card.card_id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-2xl p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">
                          Правильных
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {card.correct_answers}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-2xl p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">
                          Всего попыток
                        </p>
                        <p className="text-3xl font-bold text-purple-600">
                          {card.repetitions}
                        </p>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4 text-center mt-3">
                      <p className="text-xs text-gray-600 mb-1">Точность</p>
                      <p className="text-3xl font-bold text-green-600">
                        {Math.round(card.accuracy_percentage)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyCardsPage
