// The sounds themselves, as plain data and pure functions (Sound v2, D-051).
// Everything is synthesised in the browser: no audio files, so nothing to licence.
// src/lib/sound.ts turns these recipes into Web Audio nodes.

import type { Surface } from '@content/types'

export type SoundName = 'tap' | 'success' | 'soft' | 'open' | 'flip' | 'unlock'
export type { Surface }

export interface Note {
  freq: number // Hz
  at: number // seconds after play()
  length: number // seconds
}

export interface Recipe {
  wave: OscillatorType
  volume: number
  notes: Note[]
}

/** Short interface sounds. */
export const EFFECTS: Record<SoundName, Recipe> = {
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
  // A panel or the map opening: two soft rising notes.
  open: {
    wave: 'sine',
    volume: 0.08,
    notes: [
      { freq: 587, at: 0, length: 0.08 },
      { freq: 880, at: 0.06, length: 0.12 },
    ],
  },
  // A card turning over: a quick upward sweep of notes, like a page.
  flip: {
    wave: 'triangle',
    volume: 0.07,
    notes: [
      { freq: 392, at: 0, length: 0.05 },
      { freq: 523, at: 0.03, length: 0.05 },
      { freq: 659, at: 0.06, length: 0.08 },
    ],
  },
  // A new place opens: a small bright arpeggio.
  unlock: {
    wave: 'triangle',
    volume: 0.13,
    notes: [
      { freq: 523, at: 0, length: 0.1 },
      { freq: 659, at: 0.08, length: 0.1 },
      { freq: 784, at: 0.16, length: 0.1 },
      { freq: 1047, at: 0.24, length: 0.35 },
    ],
  },
}

/** A footstep: a short burst of filtered noise, darker on earth, a little hollow on a floor. */
export const STEPS: Record<Surface, { filter: BiquadFilterType; freq: number; volume: number; length: number }> = {
  paving: { filter: 'bandpass', freq: 1800, volume: 0.09, length: 0.05 },
  earth: { filter: 'lowpass', freq: 700, volume: 0.12, length: 0.07 },
  floor: { filter: 'bandpass', freq: 900, volume: 0.1, length: 0.06 },
}

/** One cycle of the walk (two steps) takes 0.84 s in character.css, so a step every 0.42 s. */
export const STEP_SECONDS = 0.42

// ---------------------------------------------------------------- ambience

export type AmbientEvent = 'bird' | 'bell' | 'clink' | 'crow'

export interface Ambience {
  /** A bed of filtered noise: traffic far away, wind, a sizzling tawa, a fan. */
  bed: { filter: BiquadFilterType; freq: number; volume: number; sway?: number }
  /** Little sounds now and then, each every `every[0]` to `every[1]` seconds. */
  events: { kind: AmbientEvent; every: [number, number]; volume: number }[]
}

/** Ambience by the scene's `ambience` key (like art, by key; the engine never names a building). */
export const AMBIENCES: Record<string, Ambience> = {
  town: {
    bed: { filter: 'lowpass', freq: 420, volume: 0.05 },
    events: [
      { kind: 'bird', every: [3, 7], volume: 0.05 },
      { kind: 'crow', every: [14, 24], volume: 0.03 },
    ],
  },
  school: {
    bed: { filter: 'lowpass', freq: 520, volume: 0.04, sway: 0.15 },
    events: [
      { kind: 'bird', every: [2.5, 6], volume: 0.05 },
      { kind: 'bell', every: [18, 30], volume: 0.04 },
    ],
  },
  dhaba: {
    bed: { filter: 'bandpass', freq: 2600, volume: 0.025 },
    events: [
      { kind: 'clink', every: [2, 5], volume: 0.04 },
      { kind: 'crow', every: [16, 28], volume: 0.025 },
    ],
  },
  home: {
    bed: { filter: 'lowpass', freq: 300, volume: 0.05, sway: 0.25 },
    events: [{ kind: 'bird', every: [9, 16], volume: 0.025 }],
  },
  panchayat: {
    bed: { filter: 'lowpass', freq: 450, volume: 0.045, sway: 0.2 },
    events: [
      { kind: 'bird', every: [4, 8], volume: 0.045 },
      { kind: 'crow', every: [12, 22], volume: 0.03 },
    ],
  },
  sandbox: {
    bed: { filter: 'lowpass', freq: 420, volume: 0.04 },
    events: [{ kind: 'bird', every: [4, 8], volume: 0.04 }],
  },
}

// ---------------------------------------------------------------- music

/**
 * A soft loop in the Bhupali scale (Sa Re Ga Pa Dha: C D E G A), over a quiet drone on Sa and Pa.
 * 32 beats of 0.6 s, about 19 s before it repeats. 0 is a rest.
 */
export const MUSIC = {
  beat: 0.6,
  volume: 0.045,
  drone: [130.81, 196.0], // C3 and G3
  melody: [
    523, 0, 587, 659, 784, 0, 659, 587, 523, 0, 440, 0, 523, 587, 659, 0,
    784, 880, 784, 0, 659, 587, 659, 0, 587, 523, 440, 0, 523, 0, 0, 0,
  ],
}

// ---------------------------------------------------------------- volume rules

export interface SoundState {
  enabled: boolean // the "Sound effects" setting (also the ambience and footsteps)
  music: boolean // the "Music" setting
  silent: boolean // true on the Help Centre
  tone: 'normal' | 'gentle' // the current scene's tone
}

/** How loud effects, ambience and footsteps play: 0 (not at all), 0.5 (gentle) or 1. */
export function soundGain(state: SoundState): number {
  if (!state.enabled || state.silent) return 0
  return state.tone === 'gentle' ? 0.5 : 1
}

/** How loud the music plays, with its own setting; never on the Help Centre, half in gentle scenes. */
export function musicGain(state: SoundState): number {
  if (!state.music || state.silent) return 0
  return state.tone === 'gentle' ? 0.5 : 1
}

/** Each speaker's typing blip has its own pitch, so you can hear who is talking. */
export function blipPitch(speaker: string, kind?: 'parrot'): number {
  if (speaker === 'player') return 560
  if (kind === 'parrot') return 980
  let sum = 0
  for (const ch of speaker) sum += ch.charCodeAt(0)
  return 260 + (sum % 9) * 30 // 260 to 500 Hz
}

/** Blip on every second letter, never on spaces or punctuation (it would sound like stuttering). */
export function blipsOn(grapheme: string, index: number): boolean {
  return index % 2 === 0 && /\p{L}|\p{N}/u.test(grapheme)
}
