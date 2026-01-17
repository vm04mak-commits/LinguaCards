import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FlipCard from '../components/FlipCard'
import Paywall from '../components/Paywall'
import { apiClient, AnswerType, DailyLimitInfo } from '../lib/api'

interface Card {
  id: number
  deck_id: number
  ru_text: string
  en_text: string
  status: 'new' | 'repeat' | 'known'
  current_streak: number
  deck_title?: string
  deck_emoji?: string
}

interface DeckStats {
  total: number
  new: number
  repeat: number
  known: number
}

type LanguageDirection = 'ru-en' | 'en-ru'

// Session storage keys
const STORAGE_VERSION = 'v4' // Increment to invalidate old cached data (v4 = fixed axios params)
const STORAGE_KEYS = {
  cards: `linguacards_cards_${STORAGE_VERSION}`,
  index: `linguacards_index_${STORAGE_VERSION}`,
  stats: `linguacards_stats_${STORAGE_VERSION}`,
  direction: 'linguacards_direction',
  selectedDeck: 'linguacards_selected_deck',
}

interface DeckInfo {
  id: number
  title: string
  emoji: string
}

const HomePage = () => {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>([])
  const [stats, setStats] = useState<DeckStats | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<LanguageDirection>('ru-en')
  const [deckInfo, setDeckInfo] = useState<DeckInfo | null>(null)
  const [limitInfo, setLimitInfo] = useState<DailyLimitInfo | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const isInitialized = useRef(false)

  // Load from session storage or fetch from API
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    // Clean up old version storage keys
    sessionStorage.removeItem('linguacards_cards')
    sessionStorage.removeItem('linguacards_index')
    sessionStorage.removeItem('linguacards_stats')
    sessionStorage.removeItem('linguacards_cards_v1')
    sessionStorage.removeItem('linguacards_index_v1')
    sessionStorage.removeItem('linguacards_stats_v1')
    sessionStorage.removeItem('linguacards_cards_v2')
    sessionStorage.removeItem('linguacards_index_v2')
    sessionStorage.removeItem('linguacards_stats_v2')
    sessionStorage.removeItem('linguacards_cards_v3')
    sessionStorage.removeItem('linguacards_index_v3')
    sessionStorage.removeItem('linguacards_stats_v3')

    // Check if this is a fresh app launch using window flag (not persisted)
    // @ts-ignore
    const isExistingSession = window.__linguacards_session_active

    if (!isExistingSession) {
      // Fresh app launch - mark session as active and load all cards
      // @ts-ignore
      window.__linguacards_session_active = true
      sessionStorage.removeItem(STORAGE_KEYS.selectedDeck)
      sessionStorage.removeItem(STORAGE_KEYS.cards)
      sessionStorage.removeItem(STORAGE_KEYS.index)
      sessionStorage.removeItem(STORAGE_KEYS.stats)
      setDeckInfo(null) // Reset deck info to show "LinguaCards"
      loadCards()
      return
    }

    // Existing session (navigating between pages) - try to restore from cache
    const savedCards = sessionStorage.getItem(STORAGE_KEYS.cards)
    const savedIndex = sessionStorage.getItem(STORAGE_KEYS.index)
    const savedStats = sessionStorage.getItem(STORAGE_KEYS.stats)
    const savedDirection = sessionStorage.getItem(STORAGE_KEYS.direction)
    const savedDeckId = sessionStorage.getItem(STORAGE_KEYS.selectedDeck)

    // Restore deck info if a deck was selected
    if (savedDeckId) {
      const deckId = parseInt(savedDeckId, 10)
      apiClient.getDeck(deckId).then(response => {
        setDeckInfo({
          id: response.data.id,
          title: response.data.title,
          emoji: response.data.emoji || '📚',
        })
      }).catch(e => console.error('Error loading deck info:', e))
    }

    if (savedCards && savedIndex) {
      try {
        const parsedCards = JSON.parse(savedCards)
        const parsedIndex = parseInt(savedIndex, 10)
        const parsedStats = savedStats ? JSON.parse(savedStats) : null

        // Validate that we have cards and index is valid
        if (parsedCards.length > 0 && parsedIndex < parsedCards.length) {
          // Check daily limits before restoring from cache
          apiClient.getDailyLimits().then(limitsResponse => {
            setLimitInfo(limitsResponse.data)
            if (limitsResponse.data.isLimitExceeded) {
              setShowPaywall(true)
              setLoading(false)
              return
            }
            // Limits OK - restore from cache
            setCards(parsedCards)
            setCurrentIndex(parsedIndex)
            setStats(parsedStats)
            if (savedDirection) {
              setDirection(savedDirection as LanguageDirection)
            }
            setLoading(false)
          }).catch(e => {
            console.error('Error checking limits:', e)
            // On error, still restore from cache
            setCards(parsedCards)
            setCurrentIndex(parsedIndex)
            setStats(parsedStats)
            if (savedDirection) {
              setDirection(savedDirection as LanguageDirection)
            }
            setLoading(false)
          })
          return
        }
      } catch (e) {
        console.error('Error parsing session storage:', e)
      }
    }

    // No valid saved state, load fresh
    loadCards()
  }, [])

  // Save state to session storage whenever it changes
  useEffect(() => {
    if (cards.length > 0) {
      sessionStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards))
      sessionStorage.setItem(STORAGE_KEYS.index, currentIndex.toString())
      if (stats) {
        sessionStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats))
      }
      sessionStorage.setItem(STORAGE_KEYS.direction, direction)
    }
  }, [cards, currentIndex, stats, direction])

  const loadCards = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, check daily limits
      try {
        const limitsResponse = await apiClient.getDailyLimits()
        setLimitInfo(limitsResponse.data)
        if (limitsResponse.data.isLimitExceeded) {
          setShowPaywall(true)
          setLoading(false)
          return
        }
      } catch (e) {
        console.error('Error loading limits:', e)
        // Continue even if limits fail to load
      }

      // Check if specific deck is selected
      const selectedDeckId = sessionStorage.getItem(STORAGE_KEYS.selectedDeck)

      let response
      if (selectedDeckId) {
        // Load cards from specific deck (limit 20)
        const deckId = parseInt(selectedDeckId, 10)
        try {
          const deckResponse = await apiClient.getDeck(deckId)
          setDeckInfo({
            id: deckResponse.data.id,
            title: deckResponse.data.title,
            emoji: deckResponse.data.emoji || '📚',
          })
        } catch (e) {
          console.error('Error loading deck info:', e)
        }
        response = await apiClient.getCardsForStudy(deckId, 20)
      } else {
        // Load cards from ALL subscribed decks (no limit, shuffled)
        setDeckInfo(null)
        response = await apiClient.getAllCardsForStudy()
      }

      setCards(response.data.cards)
      setStats(response.data.stats)
      setCurrentIndex(0)

      // Clear old session storage when loading fresh
      sessionStorage.removeItem(STORAGE_KEYS.cards)
      sessionStorage.removeItem(STORAGE_KEYS.index)
      sessionStorage.removeItem(STORAGE_KEYS.stats)
    } catch (err: any) {
      console.error('Error loading cards:', err)
      setError(err.response?.data?.message || 'Ошибка загрузки карточек')
    } finally {
      setLoading(false)
    }
  }

  // Submit answer to backend
  const submitAnswer = useCallback(async (answer: AnswerType, cardToSubmit: Card) => {
    try {
      const response = await apiClient.submitAnswer({
        cardId: cardToSubmit.id,
        answer,
        direction,
      })

      // Update limit info from response
      if (response.data.limitInfo) {
        setLimitInfo(response.data.limitInfo)
        // Check if limit was reached after this answer
        if (response.data.limitInfo.isLimitExceeded) {
          setShowPaywall(true)
        }
      }
    } catch (err: any) {
      console.error('Error saving progress:', err)
      // Check if it's a limit exceeded error
      if (err.response?.status === 403 && err.response?.data?.code === 'DAILY_LIMIT_EXCEEDED') {
        setLimitInfo(err.response.data.limitInfo)
        setShowPaywall(true)
      }
    }
  }, [direction])

  const nextCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // All cards done - reload with fresh prioritization
      // Clear session storage to force fresh load
      sessionStorage.removeItem(STORAGE_KEYS.cards)
      sessionStorage.removeItem(STORAGE_KEYS.index)
      sessionStorage.removeItem(STORAGE_KEYS.stats)
      loadCards()
    }
  }, [currentIndex, cards.length])

  const handleKnow = useCallback(() => {
    const card = cards[currentIndex]
    if (card) submitAnswer('know', card)
    nextCard()
  }, [cards, currentIndex, submitAnswer, nextCard])


  const handleDontKnow = useCallback(() => {
    const card = cards[currentIndex]
    if (card) submitAnswer('dont_know', card)
    nextCard()
  }, [cards, currentIndex, submitAnswer, nextCard])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка карточек...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadCards}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  if (cards.length === 0 && !showPaywall) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="text-gray-400 text-5xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Нет карточек
          </h2>
          <p className="text-gray-600">
            Добавьте карточки, чтобы начать изучение
          </p>
        </div>
      </div>
    )
  }

  // Show paywall when daily limit is exceeded
  if (showPaywall && limitInfo) {
    return (
      <div className="h-full bg-background">
        <Paywall
          limitInfo={limitInfo}
          onContinueTomorrow={() => navigate('/decks')}
          // onBuyNow will be added in monetization phase
        />
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  const toggleDirection = () => {
    setDirection(prev => prev === 'ru-en' ? 'en-ru' : 'ru-en')
  }

  const handleShuffle = () => {
    // Clear all card caches and selected deck
    sessionStorage.removeItem(STORAGE_KEYS.cards)
    sessionStorage.removeItem(STORAGE_KEYS.index)
    sessionStorage.removeItem(STORAGE_KEYS.stats)
    sessionStorage.removeItem(STORAGE_KEYS.selectedDeck)
    setDeckInfo(null)
    loadCards()
  }

  const frontText = direction === 'ru-en' ? currentCard.ru_text : currentCard.en_text
  const backText = direction === 'ru-en' ? currentCard.en_text : currentCard.ru_text

  // Status badge colors
  const getStatusBadge = () => {
    if (!currentCard.status || currentCard.status === 'new') {
      return { text: 'Новая', color: 'bg-blue-500' }
    }
    if (currentCard.status === 'repeat') {
      return { text: 'Повторить', color: 'bg-yellow-500' }
    }
    return { text: 'Знаю', color: 'bg-green-500' }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-2 pb-1 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {deckInfo
                ? `${deckInfo.emoji} ${deckInfo.title}`
                : 'LinguaCards'}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-600">
                {deckInfo ? `Набор #${deckInfo.id}` : 'Все наборы'}
              </p>
              <span className={`text-xs px-1.5 py-0.5 rounded ${statusBadge.color} text-white`}>
                {statusBadge.text}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Shuffle button */}
            <button
              onClick={handleShuffle}
              className="flex items-center justify-center bg-white border border-gray-300 px-2 py-1 rounded-full text-gray-700"
              title="Перемешать все карточки"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
            </button>
            {/* Language direction toggle */}
            <button
              onClick={toggleDirection}
              className="flex items-center gap-1 bg-white border border-gray-300 px-2 py-1 rounded-full text-xs font-medium text-gray-700"
            >
              <span>{direction === 'ru-en' ? 'RU' : 'EN'}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>{direction === 'ru-en' ? 'EN' : 'RU'}</span>
            </button>
            <div className="bg-primary text-white px-2 py-1 rounded-full text-xs font-semibold">
              {currentIndex + 1}/{cards.length}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="flex gap-1 mb-1">
            <div className="flex-1 bg-yellow-500 rounded-full h-1" style={{ flex: stats.repeat || 0.01 }} title={`Повторить: ${stats.repeat}`} />
            <div className="flex-1 bg-blue-500 rounded-full h-1" style={{ flex: stats.new || 0.01 }} title={`Новые: ${stats.new}`} />
            <div className="flex-1 bg-green-500 rounded-full h-1" style={{ flex: stats.known || 0.01 }} title={`Знаю: ${stats.known}`} />
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full bg-purple-200 rounded-full h-1">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / cards.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Card area - fills remaining space */}
      <div className="flex-1 px-4 min-h-0">
        <FlipCard
          frontText={frontText}
          backText={backText}
          onKnow={handleKnow}
          onDontKnow={handleDontKnow}
        />
      </div>
    </div>
  )
}

export default HomePage
