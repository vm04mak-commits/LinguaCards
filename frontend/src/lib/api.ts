import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Get initData from Telegram WebApp
const getInitData = (): string => {
  return window.Telegram?.WebApp?.initData || ''
}

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

// Add initData to all requests
api.interceptors.request.use((config) => {
  const initData = getInitData()
  if (initData) {
    config.headers['x-telegram-init-data'] = initData
  }
  return config
})

// Types
export type AnswerType = 'know' | 'dont_know';

export interface SubmitAnswerDto {
  cardId: number;
  answer: AnswerType;
  direction: 'ru-en' | 'en-ru';
}

// API methods
export const apiClient = {
  // Users
  getMe: () => api.get('/users/me'),

  // Decks
  getDecks: () => api.get('/decks'),
  getDeck: (id: number) => api.get(`/decks/${id}`),
  getMyDecks: () => api.get('/decks/my'),
  subscribeToDeck: (deckId: number) => api.post(`/decks/${deckId}/subscribe`),
  unsubscribeFromDeck: (deckId: number) => api.delete(`/decks/${deckId}/subscribe`),
  isSubscribedToDeck: (deckId: number) => api.get(`/decks/${deckId}/subscribed`),

  // Cards
  getCards: (deckId: number) => api.get(`/cards/deck/${deckId}`),
  getCardsForStudy: (deckId: number, limit?: number) =>
    api.get(`/cards/study/${deckId}`, limit !== undefined ? { params: { limit } } : {}),
  getAllCardsForStudy: (limit?: number) =>
    api.get('/cards/study-all', limit !== undefined ? { params: { limit } } : {}),
  getDeckStats: (deckId: number) => api.get(`/cards/stats/${deckId}`),

  // Progress
  getStats: () => api.get('/progress/stats'),
  submitAnswer: (data: SubmitAnswerDto) => api.post('/progress/answer', data),
  getCardProgress: (cardId: number) => api.get(`/progress/card/${cardId}`),
  getDeckProgress: (deckId: number) => api.get(`/progress/deck/${deckId}`),
  getAllDecksProgress: () => api.get('/progress/all-decks'),
}
