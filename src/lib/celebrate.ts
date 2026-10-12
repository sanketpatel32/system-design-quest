import confetti from 'canvas-confetti'

export function fireConfetti(reducedMotion: boolean) {
  if (reducedMotion) return
  const colors = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF', '#FF9600']
  confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 }, colors, scalar: 1.1 })
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors })
  }, 250)
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
