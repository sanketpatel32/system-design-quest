import { IconHeart } from '../icons/HudIcons'

export function HeartsHud({ hearts, max = 3 }: { hearts: number; max?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${hearts} hearts remaining`}>
      {Array.from({ length: max }).map((_, i) => (
        <IconHeart key={i} filled={i < hearts} />
      ))}
    </div>
  )
}
