/**
 * Application limits configuration
 * All limits and pricing can be adjusted here
 */

export const LIMITS_CONFIG = {
  // Daily limits for free users
  FREE_DAILY_CARDS_LIMIT: 40,
  FREE_DAILY_TRANSLATIONS_LIMIT: 5,

  // Premium pricing in Telegram Stars
  PREMIUM_PRICES: {
    DAY: 50,      // Pro на день
    MONTH: 500,   // Pro на месяц
    LIFETIME: 1200, // Pro пожизненно
  },

  // One-time purchase to unlock daily limit
  UNLOCK_DAY_PRICE: 50, // Stars to continue studying today

  // Accuracy thresholds for card status
  ACCURACY: {
    KNOWN_THRESHOLD: 80, // 80%+ accuracy = known
  },

  // Streak requirements
  STREAK: {
    MIN_CORRECT_FOR_KNOWN: 3, // minimum correct answers to be "known"
  },
} as const;

export type LimitsConfig = typeof LIMITS_CONFIG;
