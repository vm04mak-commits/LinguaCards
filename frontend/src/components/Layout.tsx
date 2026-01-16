import { Outlet, NavLink, useLocation } from 'react-router-dom'

const Layout = () => {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <div className={`bg-background flex flex-col ${isHomePage ? 'h-full overflow-hidden' : 'min-h-screen'}`}>
      {/* Main content */}
      <main className={`flex-1 ${isHomePage ? 'min-h-0' : 'pb-20'}`}>
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 safe-area-inset-bottom z-50">
        <div className="flex justify-around items-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs font-medium">Карточки</span>
          </NavLink>

          <NavLink
            to="/decks"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span className="text-xs font-medium">Темы</span>
          </NavLink>

          <NavLink
            to="/my-cards"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-xs font-medium">Мои карточки</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}

export default Layout
