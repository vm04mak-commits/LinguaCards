import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CreateDeckPage = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('📚')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Send to backend
    console.log('Creating deck:', { title, description, emoji })
    alert('Функция создания набора будет доступна позже')
    navigate('/decks')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/decks')}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Создать набор</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Иконка
            </label>
            <div className="flex gap-3 flex-wrap">
              {['📚', '✈️', '🍕', '💼', '⭐', '🎯', '🎨', '🎵'].map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setEmoji(icon)}
                  className={`text-4xl p-3 rounded-xl border-2 ${
                    emoji === icon
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Название набора
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Например: Мои любимые слова"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Описание
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Краткое описание набора"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Создать набор
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateDeckPage
