import type { Mood } from '@content/types'
import { Character, type Pose } from './Character'
import type { CharacterSpec } from './spec'

/**
 * Head-and-shoulders portrait with a mood, for dialogue and results.
 * Same drawing as the full character, so a player always looks like themselves.
 */
export function Portrait({
  spec,
  mood = 'neutral',
  talking = false,
  label,
  className = 'size-24',
}: {
  spec: CharacterSpec
  mood?: Mood
  talking?: boolean
  label?: string
  className?: string
}) {
  const pose: Pose = talking ? 'talk' : 'idle'
  return (
    <div className={`overflow-hidden rounded-full bg-gradient-to-b from-marigold-soft to-plaster-deep shadow-soft ${className}`}>
      <Character spec={spec} view="portrait" mood={mood} pose={pose} label={label} className="size-full" />
    </div>
  )
}
