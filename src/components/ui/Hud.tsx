import { useEffect, useRef, useState } from 'react'
import { IconHeart } from '../icons/HudIcons'

export function HeartsHud({ hearts, max = 3 }: { hearts: number; max?: number }) {
  const prev = useRef(hearts)
  const [shakeKey, setShakeKey] = useState(0)

  useEffect(() => {
    if (hearts < prev.current) setShakeKey((k) => k + 1)
    prev.current = hearts
  }, [hearts])

  return (
    <div
      key={shakeKey}
      className={`flex items-center gap-0.5 ${shakeKey ? 'hearts-shake' : ''}`}
      role="img"
      aria-label={`${hearts} of ${max} hearts remaining`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <IconHeart key={i} filled={i < hearts} size={30} />
      ))}
    </div>
  )
}
