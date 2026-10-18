import { describe, expect, it } from 'vitest'
import { makeSupabase } from './supabase'

describe('NFR-03 the backend is optional', () => {
  it('gives no client when the URL or key is missing, so the game runs offline', () => {
    expect(makeSupabase(undefined, undefined)).toBeNull()
    expect(makeSupabase('https://example.supabase.co', '')).toBeNull()
    expect(makeSupabase('', 'sb_publishable_example')).toBeNull()
  })

  it('makes a client when both are set', () => {
    expect(makeSupabase('https://example.supabase.co', 'sb_publishable_example')).not.toBeNull()
  })
})
