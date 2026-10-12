import confetti from 'canvas-confetti'

export function fireConfetti(reducedMotion: boolean) {
  if (reducedMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  // One small, soft burst behind the cheering Byte
  const colors = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF', '#FF9600']
  confetti({ particleCount: 60, spread: 70, startVelocity: 32, gravity: 1.1, ticks: 160, origin: { y: 0.45 }, colors, scalar: 0.9 })
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
