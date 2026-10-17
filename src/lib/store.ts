// The app's saved state: profiles on this device, the active profile, settings,
// and each profile's progress. Saved to localStorage by zustand's persist middleware.
//
// Rule: the store holds data and calls rules.ts. It contains no game rules itself.

import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { Band } from '@content/types'
import { defaultSpec, normalizeSpec, type CharacterSpec } from '@/character/spec'
import type { Lang } from './i18n'
import {
  bestProgress,
  cleanFirstName,
  cleanQuestion,
  isValidFirstName,
  progressFromResult,
  type BuildingResult,
  type Extras,
  type ProgressMap,
} from './rules'

// ---------------------------------------------------------------- types

export interface Profile {
  id: string
  firstName: string // the only personal data we keep (NFR-01)
  band: Band
  avatar: CharacterSpec // the player's character (no photo, ever)
  createdAt: number
}

export interface Settings {
  sound: boolean
  music: boolean
  calmMotion: boolean
  lang: Lang
}

/** An Ask an Expert question. It stays on this device and is never synced (safety rule). */
export interface Question {
  id: string
  text: string
  at: number
}

/** Everything saved for one profile. */
export interface ProfileData {
  progress: ProgressMap
  extras: Extras
  questions?: Question[] // missing in saves from before D-042
}

export type ExtraKind = keyof Extras

export interface SakshamState {
  profiles: Profile[]
  activeProfileId: string | null
  settings: Settings
  data: Record<string, ProfileData>
  demo: boolean // demo mode: every playable building unlocked (FR-17)

  /** Adds a profile and makes it active. Returns null if the name is not valid. */
  addProfile: (firstName: string, band: Band, avatar?: CharacterSpec) => Profile | null
  removeProfile: (id: string) => void
  setActiveProfile: (id: string | null) => void
  /** Changes the active player's character. */
  setAvatar: (avatar: CharacterSpec) => void
  updateSettings: (changes: Partial<Settings>) => void
  /** Saves a finished play-through for the active profile, keeping the best result. */
  recordResult: (buildingId: string, result: BuildingResult) => void
  /** Adds a card, badge, marigold or pledge id to the active profile (no duplicates). */
  addExtra: (kind: ExtraKind, id: string) => void
  /** Saves an Ask an Expert question for the active profile. Returns false if it is empty or too long. */
  addQuestion: (text: string) => boolean
  removeQuestion: (id: string) => void
  setDemo: (on: boolean) => void
}

export const defaultSettings: Settings = {
  sound: true,
  music: true,
  calmMotion: false,
  lang: 'en',
}

const emptyData = (): ProfileData => ({
  progress: {},
  extras: { cards: [], badges: [], marigolds: [], pledges: [] },
})

/** The state before anything is saved. Used on first load and by tests. */
export function initialState() {
  return {
    profiles: [] as Profile[],
    activeProfileId: null as string | null,
    settings: { ...defaultSettings },
    data: {} as Record<string, ProfileData>,
    demo: false,
  }
}

// ---------------------------------------------------------------- storage

// localStorage can be missing or throw (private windows, blocked storage, tests).
// Then we keep data in memory for this visit instead of crashing.
const memory = new Map<string, string>()
const memoryStorage: StateStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => void memory.set(key, value),
  removeItem: (key) => void memory.delete(key),
}

function pickStorage(): StateStorage {
  try {
    const probe = '__saksham_probe__'
    localStorage.setItem(probe, probe)
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    return memoryStorage
  }
}

function newId(): string {
  // randomUUID needs a secure context (https or localhost); fall back otherwise.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// ---------------------------------------------------------------- store

export const useStore = create<SakshamState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      addProfile: (firstName, band, avatar = defaultSpec) => {
        if (!isValidFirstName(firstName)) return null
        const profile: Profile = {
          id: newId(),
          firstName: cleanFirstName(firstName),
          band,
          avatar: normalizeSpec(avatar),
          createdAt: Date.now(),
        }
        set((s) => ({
          profiles: [...s.profiles, profile],
          activeProfileId: profile.id,
          data: { ...s.data, [profile.id]: emptyData() },
        }))
        return profile
      },

      removeProfile: (id) =>
        set((s) => {
          const data = { ...s.data }
          delete data[id]
          return {
            profiles: s.profiles.filter((p) => p.id !== id),
            activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
            data,
          }
        }),

      setActiveProfile: (id) => {
        if (id !== null && !get().profiles.some((p) => p.id === id)) return
        set({ activeProfileId: id })
      },

      setAvatar: (avatar) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === s.activeProfileId ? { ...p, avatar: normalizeSpec(avatar) } : p)),
        })),

      updateSettings: (changes) => set((s) => ({ settings: { ...s.settings, ...changes } })),

      recordResult: (buildingId, result) => {
        const id = get().activeProfileId
        if (!id) return
        set((s) => {
          const current = s.data[id] ?? emptyData()
          const progress = bestProgress(current.progress[buildingId], progressFromResult(result))
          return { data: { ...s.data, [id]: { ...current, progress: { ...current.progress, [buildingId]: progress } } } }
        })
      },

      addExtra: (kind, itemId) => {
        const id = get().activeProfileId
        if (!id) return
        set((s) => {
          const current = s.data[id] ?? emptyData()
          if (current.extras[kind].includes(itemId)) return {}
          const extras = { ...current.extras, [kind]: [...current.extras[kind], itemId] }
          return { data: { ...s.data, [id]: { ...current, extras } } }
        })
      },

      addQuestion: (text) => {
        const id = get().activeProfileId
        const clean = cleanQuestion(text)
        if (!id || !clean) return false
        set((s) => {
          const current = s.data[id] ?? emptyData()
          const questions = [...(current.questions ?? []), { id: newId(), text: clean, at: Date.now() }]
          return { data: { ...s.data, [id]: { ...current, questions } } }
        })
        return true
      },

      removeQuestion: (questionId) => {
        const id = get().activeProfileId
        if (!id) return
        set((s) => {
          const current = s.data[id] ?? emptyData()
          const questions = (current.questions ?? []).filter((q) => q.id !== questionId)
          return { data: { ...s.data, [id]: { ...current, questions } } }
        })
      },

      setDemo: (on) => set({ demo: on }),
    }),
    {
      name: 'saksham',
      // Version 2 added the character (avatar) to each profile.
      version: 2,
      migrate: (saved, version) => {
        const s = (saved ?? {}) as { profiles?: Partial<Profile>[] }
        if (version < 2) s.profiles = (s.profiles ?? []).map((p) => ({ ...p, avatar: { ...defaultSpec } }))
        return s
      },
      storage: createJSONStorage(pickStorage),
      // Save data only; functions are rebuilt on load.
      partialize: (s) => ({
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
        settings: s.settings,
        data: s.data,
        demo: s.demo,
      }),
      // Settings added in later versions get their defaults.
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<SakshamState>
        return {
          ...current,
          ...s,
          settings: { ...defaultSettings, ...s.settings },
          // A damaged or older character falls back to sensible defaults.
          profiles: (s.profiles ?? []).map((p) => ({ ...p, avatar: normalizeSpec(p.avatar) })),
        }
      },
    },
  ),
)

// ---------------------------------------------------------------- selectors

export const selectActiveProfile = (s: SakshamState): Profile | null =>
  s.profiles.find((p) => p.id === s.activeProfileId) ?? null

export const selectActiveData = (s: SakshamState): ProfileData | null =>
  s.activeProfileId ? (s.data[s.activeProfileId] ?? null) : null
