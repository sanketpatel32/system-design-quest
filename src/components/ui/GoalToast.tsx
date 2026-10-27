import { useEffect, useState } from 'react'
import { GOAL_EVENT, usePractice } from '../../lib/fun/practice'
import { Mascot } from '../art/Mascot'

/** A small, non-blocking cheer when today's goal is reached. It never covers the answer feedback for long. */
export function GoalToast() {
  const p = usePractice()
  const [show, setShow] = useState(false)
  useEffect(() => {
    let t = 0
    const on = () => {
      setShow(true)
      window.clearTimeout(t)
      t = window.setTimeout(() => setShow(false), 3200)
    }
    window.addEventListener(GOAL_EVENT, on)
    return () => { window.removeEventListener(GOAL_EVENT, on); window.clearTimeout(t) }
  }, [])
  return (
    <div aria-live="polite" className="contents">
      {show && (
        <div className="goal-toast" data-testid="goal-toast">
          <Mascot mood="happy" size={40} />
          <span>Daily goal reached: {p.goal} questions. Nice work!</span>
        </div>
      )}
    </div>
  )
}
