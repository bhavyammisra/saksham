// Sound manager: one API, sound.play(name).
//
// - The WebAudio context is created on the child's first tap or key press
//   (browsers block audio before a user gesture).
// - Respects the "Sound effects" setting.
// - Plays nothing while the Help Centre is open (safety rule).
// - Plays at half volume in `gentle` scenes.
// Sounds are synthesised for now (no audio files, so nothing to licence).
// Recorded ambience and music arrive in Phase 6.

import type { Tone } from '@content/types'

export type SoundName = 'tap' | 'success' | 'soft'

interface Note {
  freq: number // Hz
  at: number // seconds after play()
  length: number // seconds
}

const recipes: Record<SoundName, { wave: OscillatorType; volume: number; notes: Note[] }> = {
  tap: { wave: 'sine', volume: 0.12, notes: [{ freq: 660, at: 0, length: 0.06 }] },
  soft: { wave: 'sine', volume: 0.1, notes: [{ freq: 440, at: 0, length: 0.2 }] },
  success: {
    wave: 'triangle',
    volume: 0.15,
    notes: [
      { freq: 523, at: 0, length: 0.12 },
      { freq: 659, at: 0.1, length: 0.12 },
      { freq: 784, at: 0.2, length: 0.25 },
    ],
  },
}

export interface SoundState {
  enabled: boolean // the "Sound effects" setting
  silent: boolean // true on the Help Centre
  tone: Tone // the current scene's tone
}

/** How loud sounds play: 0 (not at all), 0.5 (gentle) or 1. Pure, so it is unit-tested. */
export function soundGain(state: SoundState): number {
  if (!state.enabled || state.silent) return 0
  return state.tone === 'gentle' ? 0.5 : 1
}

const state: SoundState = { enabled: true, silent: false, tone: 'normal' }
let context: AudioContext | null = null

export const sound = {
  /** Call once at start-up. Creates the audio context on the first tap or key press. */
  unlockOnFirstGesture(): void {
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      if (context || typeof AudioContext === 'undefined') return
      context = new AudioContext()
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
  },

  setEnabled(on: boolean): void {
    state.enabled = on
  },

  /** Silence everything (used while the Help Centre is open). */
  setSilent(on: boolean): void {
    state.silent = on
  },

  setTone(tone: Tone): void {
    state.tone = tone
  },

  play(name: SoundName): void {
    const gain = soundGain(state)
    if (gain === 0 || !context) return
    if (context.state === 'suspended') void context.resume()

    const recipe = recipes[name]
    const now = context.currentTime
    for (const note of recipe.notes) {
      const osc = context.createOscillator()
      const amp = context.createGain()
      osc.type = recipe.wave
      osc.frequency.value = note.freq
      // A quick fade in and out, so notes don't click.
      const start = now + note.at
      const end = start + note.length
      amp.gain.setValueAtTime(0, start)
      amp.gain.linearRampToValueAtTime(recipe.volume * gain, start + 0.01)
      amp.gain.exponentialRampToValueAtTime(0.0001, end)
      osc.connect(amp).connect(context.destination)
      osc.start(start)
      osc.stop(end + 0.02)
    }
  },
}
