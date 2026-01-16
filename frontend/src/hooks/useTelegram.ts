import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: any
    }
  }
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export const useTelegram = () => {
  const [tg, setTg] = useState<any>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [initData, setInitData] = useState<string>('')

  useEffect(() => {
    const telegram = window.Telegram?.WebApp

    if (telegram) {
      setTg(telegram)
      setInitData(telegram.initData || '')

      // Get user data
      if (telegram.initDataUnsafe?.user) {
        setUser(telegram.initDataUnsafe.user)
      }

      // Ready to show
      telegram.ready()
    }
  }, [])

  return {
    tg,
    user,
    initData,
    platform: tg?.platform,
    colorScheme: tg?.colorScheme,
  }
}
