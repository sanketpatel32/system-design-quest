import { IconFlame } from '../icons/HudIcons'

/** Shows the current run of correct answers once it reaches 2; re-keyed so it pops on each new answer */
export function ComboChip({ combo }: { combo: number }) {
  if (combo < 2) return null
  return (
    <span key={combo} className="combo-chip anim-pop" role="status" aria-label={`${combo} correct in a row`} data-testid="combo-chip">
      <IconFlame size={18} />
      <span aria-hidden>×{combo}</span>
    </span>
  )
}
