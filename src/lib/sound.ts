// Sound manager (Sound v2, D-051): effects, footsteps, typing blips, a bed of ambience per place,
// and a soft music loop. The recipes are in synth.ts.
//
// - The Web Audio context is created on the child's first tap or key press
//   (browsers block audio before a user gesture).
// - Effects, ambience and footsteps follow "Sound effects"; music follows "Music".
// - Nothing plays while the Help Centre is open (safety rule); gentle scenes play at half volume.
// - Everything pauses while the tab is hidden.

import { AMBIENCES, blipPitch, EFFECTS, MUSIC, musicGain, soundGain, STEPS, type AmbientEvent, type SoundName, type SoundState, type Surface } from './synth'

export type { SoundName, SoundState, Surface } from './synth'
export { soundGain, musicGain } from './synth'

const state: SoundState = { enabled: true, music: true, silent: false, tone: 'normal' }
let context: AudioContext | null = null
let effectsBus: GainNode | null = null // effects, footsteps, blips and ambience
let musicBus: GainNode | null = null
let noise: AudioBuffer | null = null
let ambienceKey: string | null = null
let stopAmbience: (() => void) | null = null
let stopMusic: (() => void) | null = null

/** Sets both buses to what the state allows, with a short ramp so nothing clicks. */
function applyGains() {
  if (!context || !effectsBus || !musicBus) return
  const now = context.currentTime
  effectsBus.gain.setTargetAtTime(soundGain(state), now, 0.08)
  musicBus.gain.setTargetAtTime(musicGain(state), now, 0.3)
}

/** Two seconds of white noise, looped for beds and cut short for footsteps. */
function noiseBuffer(ctx: AudioContext) {
  if (noise) return noise
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noise
}

/** One note with a quick fade in and out (no clicks). */
function tone(ctx: AudioContext, out: AudioNode, wave: OscillatorType, freq: number, start: number, length: number, volume: number, glideTo?: number) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = wave
  osc.frequency.setValueAtTime(freq, start)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + length)
  amp.gain.setValueAtTime(0, start)
  amp.gain.linearRampToValueAtTime(volume, start + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(amp).connect(out)
  osc.start(start)
  osc.stop(start + length + 0.02)
}

function ambientEvent(ctx: AudioContext, out: AudioNode, kind: AmbientEvent, volume: number) {
  const now = ctx.currentTime
  if (kind === 'bird') {
    const chirps = 2 + Math.floor(Math.random() * 3)
    const base = 2400 + Math.random() * 900
    for (let i = 0; i < chirps; i++) tone(ctx, out, 'sine', base, now + i * 0.11, 0.07, volume, base * 1.45)
  } else if (kind === 'bell') {
    tone(ctx, out, 'sine', 880, now, 2.2, volume)
    tone(ctx, out, 'sine', 1320, now, 1.4, volume * 0.4)
  } else if (kind === 'clink') {
    const freq = 2200 + Math.random() * 1200
    tone(ctx, out, 'triangle', freq, now, 0.18, volume)
    tone(ctx, out, 'sine', freq * 1.5, now + 0.01, 0.12, volume * 0.5)
  } else {
    // A crow: two rough falling calls, far away.
    for (let i = 0; i < 2; i++) tone(ctx, out, 'sawtooth', 620, now + i * 0.32, 0.22, volume * 0.6, 430)
  }
}

function startAmbience(ctx: AudioContext, key: string) {
  const recipe = AMBIENCES[key]
  if (!recipe || !effectsBus) return () => {}
  const out = ctx.createGain()
  out.gain.setValueAtTime(0, ctx.currentTime)
  out.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5) // fade in
  out.connect(effectsBus)

  const bed = ctx.createBufferSource()
  bed.buffer = noiseBuffer(ctx)
  bed.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = recipe.bed.filter
  filter.frequency.value = recipe.bed.freq
  const level = ctx.createGain()
  level.gain.value = recipe.bed.volume
  bed.connect(filter).connect(level).connect(out)
  // A slow sway in the bed's loudness, like wind or a fan.
  let lfo: OscillatorNode | null = null
  if (recipe.bed.sway) {
    lfo = ctx.createOscillator()
    lfo.frequency.value = 0.15
    const depth = ctx.createGain()
    depth.gain.value = recipe.bed.volume * recipe.bed.sway
    lfo.connect(depth).connect(level.gain)
    lfo.start()
  }
  bed.start()

  const timers = recipe.events.map((event) => {
    let timer = 0
    const next = () => {
      const [min, max] = event.every
      timer = window.setTimeout(() => {
        if (!document.hidden) ambientEvent(ctx, out, event.kind, event.volume)
        next()
      }, (min + Math.random() * (max - min)) * 1000)
    }
    next()
    return () => window.clearTimeout(timer)
  })

  return () => {
    timers.forEach((clear) => clear())
    const end = ctx.currentTime + 0.6
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.15) // fade out, then let go
    bed.stop(end)
    lfo?.stop(end)
  }
}

function startMusic(ctx: AudioContext, bus: GainNode) {
  // The drone: two quiet notes held under everything.
  const drones = MUSIC.drone.map((freq) => {
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    amp.gain.value = MUSIC.volume * 0.35
    osc.connect(amp).connect(bus)
    osc.start()
    return osc
  })
  // The melody is scheduled a little ahead, a few beats at a time, so it keeps perfect time.
  let beat = 0
  let at = ctx.currentTime + 0.3
  const schedule = () => {
    while (at < ctx.currentTime + 1.5) {
      const freq = MUSIC.melody[beat % MUSIC.melody.length]
      if (freq) tone(ctx, bus, 'triangle', freq, at, MUSIC.beat * 1.6, MUSIC.volume)
      beat++
      at += MUSIC.beat
    }
  }
  schedule()
  const timer = window.setInterval(schedule, 400)
  return () => {
    window.clearInterval(timer)
    drones.forEach((osc) => osc.stop())
  }
}

/** The music loop runs only while it can be heard: Music on, and not on the Help Centre. */
function syncMusic() {
  const wanted = musicGain(state) > 0
  if (!wanted && stopMusic) {
    stopMusic()
    stopMusic = null
  } else if (wanted && !stopMusic && context && musicBus) stopMusic = startMusic(context, musicBus)
}

/** Creates the audio graph on the first gesture, then starts whatever is waiting. */
function unlock() {
  if (context || typeof AudioContext === 'undefined') return
  context = new AudioContext()
  effectsBus = context.createGain()
  musicBus = context.createGain()
  effectsBus.gain.value = 0
  musicBus.gain.value = 0
  effectsBus.connect(context.destination)
  musicBus.connect(context.destination)
  applyGains()
  syncMusic()
  if (ambienceKey) stopAmbience = startAmbience(context, ambienceKey)
  document.addEventListener('visibilitychange', () => {
    if (!context) return
    if (document.hidden) void context.suspend()
    else void context.resume()
  })
}

export const sound = {
  /** Call once at start-up. Creates the audio context on the first tap or key press. */
  unlockOnFirstGesture(): void {
    const once = () => {
      window.removeEventListener('pointerdown', once)
      window.removeEventListener('keydown', once)
      unlock()
    }
    window.addEventListener('pointerdown', once)
    window.addEventListener('keydown', once)
  },

  setEnabled(on: boolean): void {
    state.enabled = on
    applyGains()
  },

  setMusic(on: boolean): void {
    state.music = on
    applyGains()
    syncMusic() // turned off, the loop stops for real; turned on, it starts again
  },

  /** Silence everything (used while the Help Centre is open). */
  setSilent(on: boolean): void {
    state.silent = on
    applyGains()
    syncMusic() // not a single note on the Help Centre, not even a silent one
  },

  setTone(tone: SoundState['tone']): void {
    state.tone = tone
    applyGains()
  },

  /** The bed of sound for the place on screen, by its `ambience` key; null for none. */
  setAmbience(key: string | null): void {
    if (key === ambienceKey) return
    ambienceKey = key
    stopAmbience?.()
    stopAmbience = null
    if (context && key) stopAmbience = startAmbience(context, key)
  },

  play(name: SoundName): void {
    if (!context || !effectsBus || soundGain(state) === 0) return
    if (context.state === 'suspended') void context.resume()
    const recipe = EFFECTS[name]
    const now = context.currentTime
    for (const note of recipe.notes) tone(context, effectsBus, recipe.wave, note.freq, now + note.at, note.length, recipe.volume)
  },

  step(surface: Surface): void {
    if (!context || !effectsBus || soundGain(state) === 0) return
    const recipe = STEPS[surface]
    const now = context.currentTime
    const source = context.createBufferSource()
    source.buffer = noiseBuffer(context)
    const filter = context.createBiquadFilter()
    filter.type = recipe.filter
    filter.frequency.value = recipe.freq * (0.9 + Math.random() * 0.2) // no two steps quite alike
    const amp = context.createGain()
    amp.gain.setValueAtTime(recipe.volume, now)
    amp.gain.exponentialRampToValueAtTime(0.0001, now + recipe.length)
    source.connect(filter).connect(amp).connect(effectsBus)
    source.start(now, Math.random() * 1.5, recipe.length + 0.02)
  },

  /** One typing blip for a line being typed out. */
  blip(speaker: string, kind?: 'parrot'): void {
    if (!context || !effectsBus || soundGain(state) === 0) return
    tone(context, effectsBus, 'triangle', blipPitch(speaker, kind) * (0.96 + Math.random() * 0.08), context.currentTime, 0.035, 0.035)
  },
}
