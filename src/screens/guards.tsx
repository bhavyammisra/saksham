import { Navigate, Outlet } from 'react-router'
import { selectActiveProfile, useStore } from '@/lib/store'

/** "/" sends the child to the right place: make a profile, pick one, or go to the town. */
export function StartRedirect() {
  const hasProfiles = useStore((s) => s.profiles.length > 0)
  const active = useStore(selectActiveProfile)
  if (active) return <Navigate to="/town" replace />
  return <Navigate to={hasProfiles ? '/profiles' : '/onboarding'} replace />
}

/** Screens that need a player. Without one, start again from "/". */
export function RequireProfile() {
  const active = useStore(selectActiveProfile)
  return active ? <Outlet /> : <Navigate to="/" replace />
}
