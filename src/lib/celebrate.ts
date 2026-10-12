import confetti from 'canvas-confetti'

export function fireConfetti(reducedMotion: boolean) {
  if (reducedMotion) return
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } })
}

export function playCelebrationSound(enabled: boolean, hasGesture: boolean) {
  if (!enabled || !hasGesture) return
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.frequency.value = 523.25
    g.gain.value = 0.03
    o.start()
    o.stop(ctx.currentTime + 0.15)
  } catch {
    /* audio blocked */
  }
}
