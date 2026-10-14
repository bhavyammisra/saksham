import type { ReactNode } from 'react'
import type { Mood } from '@content/types'
import { Character, type Pose } from '@/character/Character'
import { defaultSpec, hairStyles, headwears, outfits, skinTones, type CharacterSpec } from '@/character/spec'
import { Page } from '@/components/Page'
import { t } from '@/lib/i18n'

const POSES: Pose[] = ['idle', 'walk', 'talk', 'wave', 'gasp', 'cheer']
const MOODS: Mood[] = ['neutral', 'happy', 'worried', 'surprised', 'sad']

/**
 * Developer check page (/dev/characters): every outfit x headwear combination,
 * every pose, mood, skin tone and hairstyle, for spotting alignment problems.
 */
export function DevCharacters() {
  const with_ = (changes: Partial<CharacterSpec>): CharacterSpec => ({ ...defaultSpec, ...changes })

  return (
    <Page title={t('dev.characters')}>
      <Section title={t('dev.combinations')}>
        {outfits.flatMap((o) =>
          headwears.map((h) => (
            <Cell key={`${o.id}-${h.id}`} caption={`${t(o.label)} · ${t(h.label)}`}>
              <Character spec={with_({ outfit: o.id, headwear: h.id, hair: 'plait' })} />
            </Cell>
          )),
        )}
      </Section>

      <Section title={t('dev.poses')}>
        {POSES.map((pose) => (
          <Cell key={pose} caption={pose}>
            <Character spec={with_({ outfit: 'kurta', hair: 'curly' })} pose={pose} />
          </Cell>
        ))}
        <Cell caption="walk, left">
          <Character spec={with_({ outfit: 'salwar', hair: 'two-plaits', headwear: 'dupatta' })} pose="walk" facing="left" />
        </Cell>
      </Section>

      <Section title={t('dev.moods')}>
        {MOODS.map((mood) => (
          <Cell key={mood} caption={mood}>
            <Character spec={with_({ hair: 'bob', glasses: true })} mood={mood} view="portrait" />
          </Cell>
        ))}
      </Section>

      <Section title={t('dev.skinTones')}>
        {skinTones.map((s) => (
          <Cell key={s.id} caption={t(s.label)}>
            <Character spec={with_({ skin: s.id })} view="portrait" />
          </Cell>
        ))}
      </Section>

      <Section title={t('dev.hairStyles')}>
        {hairStyles.map((h) => (
          <Cell key={h.id} caption={t(h.label)}>
            <Character spec={with_({ hair: h.id, bag: false, outfit: 'casual' })} />
          </Cell>
        ))}
      </Section>
    </Page>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">{children}</ul>
    </section>
  )
}

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="rounded-card bg-plaster-deep p-2 text-center">
      <div className="mx-auto h-56 [&>svg]:h-full [&>svg]:w-full">{children}</div>
      <p className="mt-1 text-sm text-ink-soft">{caption}</p>
    </li>
  )
}
