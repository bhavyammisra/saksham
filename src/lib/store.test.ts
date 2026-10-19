import { beforeEach, describe, expect, it } from 'vitest'
import { defaultSpec } from '@/character/spec'
import { initialState, selectActiveData, selectActiveProfile, useStore } from './store'

const store = () => useStore.getState()

beforeEach(() => {
  useStore.setState(initialState())
})

describe('FR-01 profiles', () => {
  it('adds a profile with a cleaned first name and makes it active', () => {
    const profile = store().addProfile('  Asha   Rani ', 'young')
    expect(profile?.firstName).toBe('Asha Rani')
    expect(selectActiveProfile(store())?.id).toBe(profile?.id)
    expect(selectActiveData(store())?.progress).toEqual({})
  })

  it('NFR-01 refuses a name with digits or symbols and saves nothing', () => {
    expect(store().addProfile('Asha123', 'teen')).toBeNull()
    expect(store().profiles).toEqual([])
  })

  it('keeps each profile’s progress separate', () => {
    const asha = store().addProfile('Asha', 'young')!
    store().recordResult('school', { completed: true, retries: 0, score: { correct: 5, total: 5 } })
    store().addProfile('Ravi', 'teen')
    expect(selectActiveData(store())?.progress).toEqual({})
    expect(store().data[asha.id]?.progress.school?.stars).toBe(3)
  })

  it('switches the active profile only to one that exists', () => {
    const asha = store().addProfile('Asha', 'young')!
    store().addProfile('Ravi', 'teen')
    store().setActiveProfile(asha.id)
    expect(selectActiveProfile(store())?.firstName).toBe('Asha')
    store().setActiveProfile('nobody')
    expect(selectActiveProfile(store())?.firstName).toBe('Asha')
  })

  it('removing the active profile deletes its data and clears the active profile', () => {
    const asha = store().addProfile('Asha', 'young')!
    store().removeProfile(asha.id)
    expect(store().profiles).toEqual([])
    expect(store().data[asha.id]).toBeUndefined()
    expect(store().activeProfileId).toBeNull()
  })
})

describe('FR-07 saving results through the rules', () => {
  it('keeps the best result when a building is replayed', () => {
    store().addProfile('Asha', 'young')
    store().recordResult('school', { completed: true, retries: 0, score: { correct: 9, total: 10 } })
    store().recordResult('school', { completed: true, retries: 2, score: { correct: 2, total: 10 } })
    expect(selectActiveData(store())?.progress.school).toEqual({ stars: 3, bestScore: 90, completed: true })
  })

  it('does nothing without an active profile', () => {
    store().recordResult('school', { completed: true, retries: 0, score: { correct: 1, total: 1 } })
    expect(store().data).toEqual({})
  })

  it('adds extras once', () => {
    store().addProfile('Asha', 'young')
    store().addExtra('cards', 'education')
    store().addExtra('cards', 'education')
    expect(selectActiveData(store())?.extras.cards).toEqual(['education'])
  })
})

describe('settings and demo mode', () => {
  it('updates only the settings given', () => {
    store().updateSettings({ calmMotion: true })
    expect(store().settings).toMatchObject({ calmMotion: true, sound: true, lang: 'en' })
  })

  it('FR-17 turns demo mode on and off', () => {
    store().setDemo(true)
    expect(store().demo).toBe(true)
    store().setDemo(false)
    expect(store().demo).toBe(false)
  })
})

describe('FR-01 the player character', () => {
  it('a new profile gets the default character unless one is given', () => {
    const asha = store().addProfile('Asha', 'young')!
    expect(asha.avatar).toEqual(defaultSpec)
    const ravi = store().addProfile('Ravi', 'teen', { ...defaultSpec, hair: 'curly' })!
    expect(ravi.avatar.hair).toBe('curly')
  })

  it('changes only the active player’s character', () => {
    const asha = store().addProfile('Asha', 'young')!
    store().addProfile('Ravi', 'teen')
    store().setAvatar({ ...defaultSpec, outfit: 'kurta' })
    expect(selectActiveProfile(store())?.avatar.outfit).toBe('kurta')
    expect(store().profiles.find((p) => p.id === asha.id)?.avatar.outfit).toBe(defaultSpec.outfit)
  })

  it('repairs an invalid character instead of saving it', () => {
    store().addProfile('Asha', 'young')
    store().setAvatar({ ...defaultSpec, skin: 'not-a-tone' })
    expect(selectActiveProfile(store())?.avatar.skin).toBe(defaultSpec.skin)
  })
})

describe('FR-10 Ask an Expert questions stay with their player', () => {
  it('saves a tidied question for the active player only', () => {
    const asha = store().addProfile('Asha', 'young')!
    expect(store().addQuestion('  Can my   school ask for fees? ')).toBe(true)
    expect(store().data[asha.id]?.questions?.map((q) => q.text)).toEqual(['Can my school ask for fees?'])
    store().addProfile('Ravi', 'teen')
    expect(selectActiveData(store())?.questions ?? []).toEqual([])
  })

  it('refuses an empty or too long question, and removes one', () => {
    store().addProfile('Asha', 'young')
    expect(store().addQuestion('   ')).toBe(false)
    expect(store().addQuestion('a'.repeat(281))).toBe(false)
    store().addQuestion('Who can I call?')
    const id = selectActiveData(store())!.questions![0]!.id
    store().removeQuestion(id)
    expect(selectActiveData(store())?.questions).toEqual([])
  })
})

describe('FR-11 each player keeps their own class login', () => {
  it('saves the login and class for the active player only', () => {
    const asha = store().addProfile('Asha', 'young')!
    store().setCloud({ userId: 'u-asha', refreshToken: 't1' })
    store().setClassInfo({ id: 'c1', name: 'Class 6B' })
    store().addProfile('Ravi', 'teen')
    expect(selectActiveData(store())?.cloud).toBeUndefined()
    expect(store().data[asha.id]?.classInfo?.name).toBe('Class 6B')
  })

  it('a renewed login updates the player it belongs to, whoever is active', () => {
    const asha = store().addProfile('Asha', 'young')!
    store().setCloud({ userId: 'u-asha', refreshToken: 't1' })
    const ravi = store().addProfile('Ravi', 'teen')!
    store().setCloud({ userId: 'u-ravi', refreshToken: 'r1' })
    store().refreshCloud('u-asha', 't2')
    expect(store().data[asha.id]?.cloud?.refreshToken).toBe('t2')
    expect(store().data[ravi.id]?.cloud?.refreshToken).toBe('r1')
    store().refreshCloud('u-nobody', 'x') // a teacher's or unknown login changes nothing
    expect(store().data[asha.id]?.cloud?.refreshToken).toBe('t2')
  })
})

describe('FR-12 answers wait in a queue until they reach the class', () => {
  const attempts = [
    { questionId: 'age', correct: true },
    { questionId: 'fees', correct: false },
  ]

  it('queues answers only for a player who is in a class', () => {
    store().addProfile('Asha', 'young')
    store().queueAttempts('school', attempts)
    expect(selectActiveData(store())?.outbox ?? []).toEqual([])
    store().setClassInfo({ id: 'c1', name: 'Class 6B' })
    store().queueAttempts('school', attempts)
    expect(selectActiveData(store())?.outbox).toEqual([
      { buildingId: 'school', questionId: 'age', correct: true },
      { buildingId: 'school', questionId: 'fees', correct: false },
    ])
  })

  it('removes only the answers that were sent', () => {
    store().addProfile('Asha', 'young')
    store().setClassInfo({ id: 'c1', name: 'Class 6B' })
    store().queueAttempts('school', attempts)
    store().queueAttempts('dhaba', [{ questionId: 'raju', correct: true }]) // arrived while sending
    store().dropSent(2)
    expect(selectActiveData(store())?.outbox).toEqual([{ buildingId: 'dhaba', questionId: 'raju', correct: true }])
  })

  it('merges progress saved on another device with the merge rules', () => {
    store().addProfile('Asha', 'young')
    store().recordResult('school', { completed: true, retries: 1, score: { correct: 3, total: 4 } })
    store().addExtra('cards', 'right-to-education')
    store().mergeRemote(
      { school: { stars: 1, bestScore: 50, completed: true }, dhaba: { stars: 3, bestScore: 100, completed: true } },
      { cards: ['freedom-from-child-labour'], badges: [], marigolds: [], pledges: [] },
    )
    const data = selectActiveData(store())!
    expect(data.progress.school?.stars).toBe(2) // the better local result stays
    expect(data.progress.dhaba?.stars).toBe(3)
    expect(data.extras.cards).toEqual(['right-to-education', 'freedom-from-child-labour'])
  })
})
