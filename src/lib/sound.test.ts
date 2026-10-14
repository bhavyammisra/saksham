import { describe, expect, it } from 'vitest'
import { soundGain } from './sound'

describe('NFR-06 sound rules', () => {
  it('plays at full volume normally', () => {
    expect(soundGain({ enabled: true, silent: false, tone: 'normal' })).toBe(1)
  })

  it('plays at half volume in gentle scenes', () => {
    expect(soundGain({ enabled: true, silent: false, tone: 'gentle' })).toBe(0.5)
  })

  it('plays nothing when sound effects are turned off', () => {
    expect(soundGain({ enabled: false, silent: false, tone: 'normal' })).toBe(0)
  })

  it('plays nothing on the Help Centre, whatever the settings', () => {
    expect(soundGain({ enabled: true, silent: true, tone: 'normal' })).toBe(0)
    expect(soundGain({ enabled: true, silent: true, tone: 'gentle' })).toBe(0)
  })
})
