import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CharacterBuilder } from '@/character/CharacterBuilder'
import { Portrait } from '@/character/Portrait'
import { Page } from '@/components/Page'
import { t } from '@/lib/i18n'
import { selectActiveProfile, useStore } from '@/lib/store'

/**
 * Me: the player's character. Badges, settings and "switch player" join in Phase 4.
 * (RequireProfile guarantees there is an active profile here.)
 */
export function Me() {
  const profile = useStore(selectActiveProfile)
  if (!profile) return null
  return (
    <Page title={t('me.title')}>
      <div className="flex flex-wrap items-center gap-4">
        <Portrait spec={profile.avatar} mood="happy" className="size-32" label={t('builder.preview')} />
        <p className="text-xl font-semibold">{profile.firstName}</p>
      </div>
      <Link
        to="/me/character"
        className="mt-6 inline-flex min-h-tap items-center rounded-button bg-terracotta px-5 font-semibold text-white hover:bg-terracotta-deep"
      >
        {t('me.changeCharacter')}
      </Link>
    </Page>
  )
}

/** /me/character: change the character, saved on "This is me!". */
export function MeCharacter() {
  const profile = useStore(selectActiveProfile)
  const setAvatar = useStore((s) => s.setAvatar)
  const navigate = useNavigate()
  const [draft, setDraft] = useState(profile?.avatar)
  if (!profile || !draft) return null
  return (
    <Page title={t('builder.title')}>
      <CharacterBuilder
        value={draft}
        onChange={setDraft}
        onDone={() => {
          setAvatar(draft)
          navigate('/me')
        }}
      />
    </Page>
  )
}
