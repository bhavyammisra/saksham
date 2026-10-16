import { Navigate, Outlet } from 'react-router'
import { selectActiveProfile, useStore } from '@/lib/store'

/** Screens that need a player. Without one, start again from "/". */
export function RequireProfile() {
  const active = useStore(selectActiveProfile)
  return active ? <Outlet /> : <Navigate to="/" replace />
}
