import { useState, useRef, useEffect } from 'react'

interface FlipCardProps {
  frontText: string
  backText: string
  onKnow: () => void
  onDontKnow: () => void
}

// Note: "Повторить" button removed - status now calculated based on accuracy_percentage

const FlipCard = ({ frontText, backText, onKnow, onDontKnow }: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHiding, setIsHiding] = useState(false)
  const [isAppearing, setIsAppearing] = useState(false)
  const [displayFront, setDisplayFront] = useState(frontText)
  const [displayBack, setDisplayBack] = useState(backText)
  const pendingTextsRef = useRef<{ front: string; back: string } | null>(null)

  // Handle new card arriving - wait for hide animation to complete
  useEffect(() => {
    if (displayFront !== frontText || displayBack !== backText) {
      if (isHiding) {
        // Store new texts to apply after hide completes
        pendingTextsRef.current = { front: frontText, back: backText }
      } else {
        // Card is already hidden (opacity 0), safe to update
        setDisplayFront(frontText)
        setDisplayBack(backText)
        setIsFlipped(false)
        setIsAppearing(true)
        // Small delay to ensure DOM update before fade in
        setTimeout(() => setIsAppearing(false), 50)
      }
    }
  }, [frontText, backText, isHiding, displayFront, displayBack])

  // When hide animation completes, apply pending texts
  useEffect(() => {
    if (!isHiding && pendingTextsRef.current) {
      const { front, back } = pendingTextsRef.current
      pendingTextsRef.current = null
      setDisplayFront(front)
      setDisplayBack(back)
      setIsFlipped(false)
      setIsAppearing(true)
      setTimeout(() => setIsAppearing(false), 50)
    }
  }, [isHiding])

  // Handle button click
  const handleButtonClick = (callback: () => void) => {
    setIsHiding(true)

    // Wait for fade out, then trigger callback and reset hiding
    setTimeout(() => {
      callback()
      setIsHiding(false)
    }, 300)
  }

  const handleFlip = () => {
    if (!isHiding) {
      setIsFlipped(!isFlipped)
    }
  }

  // Determine which side to show (no 3D, just swap)
  const showFront = !isFlipped

  return (
    <div className="w-full h-full flex flex-col items-center justify-start pt-4">
      {/* Card */}
      <div
        className="cursor-pointer w-full max-w-xs"
        style={{
          aspectRatio: '3/4',
          maxHeight: '55vh',
          transition: 'opacity 0.25s ease-out',
          opacity: isHiding || isAppearing ? 0 : 1,
        }}
        onClick={handleFlip}
      >
        <div
          className="w-full h-full bg-gradient-to-b from-purple-500 via-purple-600 to-purple-900 rounded-xl shadow-lg flex items-center justify-center p-4"
          style={{
            transform: showFront ? 'rotateY(0)' : 'rotateY(180deg)',
            transition: isHiding ? 'none' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <h2
            className="text-white text-2xl font-bold text-center"
            style={{
              transform: showFront ? 'scaleX(1)' : 'scaleX(-1)',
            }}
          >
            {showFront ? displayFront : displayBack}
          </h2>
        </div>
      </div>

      {/* Action buttons or hint - right below card */}
      <div className="w-full max-w-xs mt-4">
        {isFlipped && !isHiding ? (
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleButtonClick(onDontKnow)
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl shadow transition-colors"
            >
              Не знаю
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleButtonClick(onKnow)
              }}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl shadow transition-colors"
            >
              Знаю
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm py-3">
            Нажмите на карточку для перевода
          </p>
        )}
      </div>
    </div>
  )
}

export default FlipCard
