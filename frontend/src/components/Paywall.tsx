import { DailyLimitInfo } from '../lib/api'

interface PaywallProps {
  limitInfo: DailyLimitInfo
  onContinueTomorrow: () => void
  onBuyNow?: () => void
}

const Paywall = ({ limitInfo, onContinueTomorrow, onBuyNow }: PaywallProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center">
        {/* Icon */}
        <div className="text-6xl mb-4">
          <span role="img" aria-label="limit">🔒</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Дневной лимит исчерпан
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Вы изучили <span className="font-semibold text-primary">{limitInfo.cardsStudiedToday}</span> карточек сегодня.
          <br />
          Бесплатный лимит: <span className="font-semibold">{limitInfo.dailyLimit}</span> карточек в день.
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full"
              style={{ width: '100%' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {limitInfo.cardsStudiedToday} / {limitInfo.dailyLimit} карточек
          </p>
        </div>

        {/* Pro benefits */}
        <div className="bg-purple-50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-2">
            С Pro подпиской:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Безлимитное изучение карточек
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Доступ ко всем тематическим наборам
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Детальная статистика обучения
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {onBuyNow && (
            <button
              onClick={onBuyNow}
              className="w-full py-3 px-6 bg-primary text-white rounded-full font-semibold text-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <span>Продолжить сейчас</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">⭐ 50</span>
            </button>
          )}

          <button
            onClick={onContinueTomorrow}
            className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
          >
            Продолжить завтра
          </button>
        </div>

        {/* Tomorrow hint */}
        <p className="text-xs text-gray-400 mt-4">
          Лимит обновится в полночь по вашему времени
        </p>
      </div>
    </div>
  )
}

export default Paywall
