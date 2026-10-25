import { describe, expect, it } from 'vitest'
import { AMBIENCES, blipPitch, blipsOn, EFFECTS, MUSIC, musicGain, soundGain, STEPS, type SoundState } from './synth'
import { getBuildings, getScene, getTownScene } from './scenes'

const base: SoundState = { enabled: true, music: true, silent: false, tone: 'normal' }

describe('NFR-06 sound rules', () => {
  it('plays at full volume normally', () => {
    expect(soundGain(base)).toBe(1)
    expect(musicGain(base)).toBe(1)
  })

  it('plays at half volume in gentle scenes', () => {
    expect(soundGain({ ...base, tone: 'gentle' })).toBe(0.5)
    expect(musicGain({ ...base, tone: 'gentle' })).toBe(0.5)
  })

  it('effects and music each have their own setting', () => {
    expect(soundGain({ ...base, enabled: false })).toBe(0)
    expect(musicGain({ ...base, enabled: false })).toBe(1)
    expect(musicGain({ ...base, music: false })).toBe(0)
    expect(soundGain({ ...base, music: false })).toBe(1)
  })

  it('plays nothing at all on the Help Centre, whatever the settings', () => {
    for (const tone of ['normal', 'gentle'] as const) {
      expect(soundGain({ ...base, silent: true, tone })).toBe(0)
      expect(musicGain({ ...base, silent: true, tone })).toBe(0)
    }
  })
})

describe('P6 Sound v2 recipes', () => {
  it('every scene has an ambience that exists, and a known surface for footsteps', () => {
    const scenes = [getTownScene(), ...getBuildings().map((b) => getScene(b.id)).filter((s) => s !== null)]
    expect(scenes.length).toBeGreaterThanOrEqual(5)
    for (const scene of scenes) {
      expect(scene.ambience, scene.id).toBeDefined()
      expect(AMBIENCES[scene.ambience ?? ''], `${scene.id} ambience`).toBeDefined()
      expect(STEPS[scene.surface ?? 'paving'], `${scene.id} surface`).toBeDefined()
    }
  })

  it('every sound stays quiet (nothing louder than the success chime)', () => {
    const loudest = EFFECTS.success.volume
    for (const recipe of Object.values(EFFECTS)) expect(recipe.volume).toBeLessThanOrEqual(loudest)
    for (const step of Object.values(STEPS)) expect(step.volume).toBeLessThanOrEqual(loudest)
    for (const amb of Object.values(AMBIENCES)) {
      expect(amb.bed.volume).toBeLessThan(0.1)
      for (const event of amb.events) expect(event.every[0]).toBeGreaterThan(1) // nothing nags
    }
    expect(MUSIC.volume).toBeLessThan(0.1)
  })

  it('the music only uses the five notes of Bhupali (C D E G A), in any octave', () => {
    const pitchClass = (f: number) => Math.round(12 * Math.log2(f / 261.63)) % 12
    for (const f of MUSIC.melody.filter(Boolean)) expect([0, 2, 4, 7, 9]).toContain((pitchClass(f) + 12) % 12)
  })

  it('each speaker has a steady blip pitch: the player, Mitthu and everyone else differ', () => {
    expect(blipPitch('ravi')).toBe(blipPitch('ravi'))
    expect(blipPitch('player')).not.toBe(blipPitch('mitthu', 'parrot'))
    for (const id of ['ravi', 'lata', 'raju', 'anu', 'pooja']) {
      expect(blipPitch(id)).toBeGreaterThanOrEqual(260)
      expect(blipPitch(id)).toBeLessThanOrEqual(500)
    }
  })

  it('blips on every second letter, never on spaces or punctuation (in Hindi too)', () => {
    expect(blipsOn('a', 0)).toBe(true)
    expect(blipsOn('a', 1)).toBe(false)
    expect(blipsOn(' ', 0)).toBe(false)
    expect(blipsOn('!', 2)).toBe(false)
    expect(blipsOn('क', 4)).toBe(true)
  })
})
