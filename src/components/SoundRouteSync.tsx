import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { sound } from '@/lib/sound'

/** Keeps the sound manager silent while the Help Centre is open. Renders nothing. */
export function SoundRouteSync() {
  const { pathname } = useLocation()
  useEffect(() => {
    sound.setSilent(pathname === '/help')
  }, [pathname])
  return null
}
