import { describe, expect, it } from 'vitest'
import type { SceneDef } from '../content/types.ts'
import { findStringKeys, isOfficialSource, validateBuildings, validateHelp, validateHubLinks, validatePeople, validateScene, validateStrings } from './validate-content.ts'
import help from '../content/help.json' with { type: 'json' }

// A tiny but complete scene. Each test breaks one thing.
function validScene(): SceneDef {
  return {
    id: 'test',
    title: 'Test place',
    right: 'Right to test',
    tagline: 'A place for tests.',
    tone: 'normal',
    width: 2000,
    layers: [{ id: 'sky', art: 'sky.svg', speed: 0.2 }],
    walkable: { minX: 100, maxX: 1900 },
    spawn: { x: 200 },
    hotspots: [
      { id: 'friend', x: 600, label: 'Talk to Ravi', kind: 'npc', npc: 'ravi', node: 'hello' },
      { id: 'note', x: 900, label: 'Look at the note', kind: 'object', node: 'note', showIf: ['met-ravi'] },
      { id: 'door', x: 1800, label: 'Leave', kind: 'exit' },
    ],
    objectives: [{ id: 'talk', text: 'Talk to Ravi', requires: ['met-ravi'] }],
    startNode: 'hello',
    nodes: {
      hello: {
        id: 'hello',
        speaker: 'ravi',
        text: 'Hi!',
        set: ['met-ravi'],
        choices: [
          { label: 'Tell a teacher', to: 'good', kind: 'good' },
          { label: 'Do nothing', to: 'weak', kind: 'weak' },
        ],
      },
      weak: { id: 'weak', speaker: 'mitthu', text: "Let's try that again.", end: 'retry' },
      good: { id: 'good', speaker: 'ravi', text: 'Thank you!', mood: 'happy', end: 'good' },
      note: { id: 'note', speaker: 'mitthu', text: 'A note.', next: 'hello' },
    },
    card: {
      id: 'test-card',
      title: 'Test right',
      kid: 'Kid text',
      teen: 'Teen text',
      ifItHappens: 'Tell an adult.',
      law: 'Law text',
      source: 'Source',
      review: { status: 'unverified', checkedBy: null, checkedOn: null, note: 'Check the law text.' },
    },
    games: [
      {
        kind: 'quiz',
        id: 'test-quiz',
        questions: [
          { id: 'q1', text: 'Q1?', options: ['A', 'B'], answer: 0, explanation: 'Because.' },
          { id: 'q2', text: 'Q2?', options: ['A', 'B', 'C'], answer: 2, explanation: 'Because.', band: 'teen' },
        ],
      },
    ],
  }
}

// Builds a broken copy of the valid scene. Typed loosely on purpose:
// these tests exist to put wrong shapes into the scene.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = Record<string, any>

function broken(change: (scene: Loose) => void): unknown {
  const scene = structuredClone(validScene()) as Loose
  change(scene)
  return scene
}

describe('NFR-07 content validation: scenes', () => {
  it('accepts a valid scene', () => {
    expect(validateScene(validScene())).toEqual([])
  })

  it('rejects something that is not an object', () => {
    expect(validateScene(null)).toEqual(['scene is not a JSON object'])
  })

  it('rejects a missing title and an unknown tone', () => {
    const errors = validateScene(broken((s) => ((s.title = ''), (s.tone = 'loud'))))
    expect(errors).toContain('"title" must be non-empty text')
    expect(errors.some((e) => e.startsWith('"tone"'))).toBe(true)
  })

  it('rejects a startNode that does not exist', () => {
    expect(validateScene(broken((s) => (s.startNode = 'nowhere')))).toContain(
      '"startNode" points to missing node "nowhere"',
    )
  })

  it('rejects next and choice targets that do not exist', () => {
    const errors = validateScene(
      broken((s) => {
        s.nodes.note.next = 'ghost'
        s.nodes.hello.choices[1].to = 'phantom'
      }),
    )
    expect(errors).toContain('node "note".next points to missing node "ghost"')
    expect(errors).toContain('node "hello".choices[1] points to missing node "phantom"')
  })

  it('rejects a scene with no good ending', () => {
    expect(validateScene(broken((s) => (s.nodes.good.end = 'retry')))).toContain('no node has end: "good"')
  })

  it('rejects a good ending that cannot be reached', () => {
    const errors = validateScene(broken((s) => (s.nodes.hello.choices = [{ label: 'Only', to: 'weak' }])))
    expect(errors).toContain('no good ending can be reached from "startNode"')
  })

  it('rejects dead ends and nodes with two ways out', () => {
    const errors = validateScene(
      broken((s) => {
        delete s.nodes.note.next
        s.nodes.good.next = 'hello'
      }),
    )
    expect(errors).toContain('node "note" is a dead end (needs "next", "choices" or "end")')
    expect(errors).toContain('node "good" must have only one of "next", "choices" or "end"')
  })

  it('rejects a node whose id does not match its key', () => {
    expect(validateScene(broken((s) => (s.nodes.note.id = 'other')))).toContain(
      'node "note" has id "other" (must match its key)',
    )
  })

  it('rejects showIf flags that no node sets', () => {
    expect(validateScene(broken((s) => (s.hotspots[1].showIf = ['never-set'])))).toContain(
      'hotspot "note".showIf uses flag "never-set" that no node sets',
    )
  })

  it('rejects objectives that need flags no node sets', () => {
    expect(validateScene(broken((s) => (s.objectives[0].requires = ['nope'])))).toContain(
      'objective "talk" requires flag "nope" that no node sets',
    )
  })

  it('rejects hotspots outside the walkable area, duplicates and missing nodes', () => {
    const errors = validateScene(
      broken((s) => {
        s.hotspots[0].x = 5000
        s.hotspots[2].id = 'friend'
        s.hotspots[1].node = 'missing'
      }),
    )
    expect(errors).toContain('hotspot "friend".x must be inside "walkable"')
    expect(errors).toContain('hotspot "friend" is duplicated')
    expect(errors).toContain('hotspot "note".node points to missing node "missing"')
  })

  it('rejects a spawn point outside the walkable area', () => {
    expect(validateScene(broken((s) => (s.spawn.x = 50)))).toContain('"spawn.x" must be inside "walkable"')
  })

  it('rejects an incomplete card', () => {
    expect(validateScene(broken((s) => (s.card.law = '')))).toContain('card.law must be non-empty text')
  })

  it('requires a fact-check record on every card', () => {
    expect(validateScene(broken((s) => delete (s.card as Partial<NonNullable<SceneDef['card']>>).review))).toContain(
      'card.review is missing (add { status: "unverified", ... } for the owner to fact-check)',
    )
  })

  it('rejects a card marked verified without who checked it and when', () => {
    const errors = validateScene(broken((s) => (s.card.review.status = 'verified')))
    expect(errors).toContain('card.review is "verified" but has no "checkedBy" and "checkedOn"')
  })

  it('accepts a verified card with a name and date', () => {
    const scene = broken((s) => (s.card.review = { status: 'verified', checkedBy: 'Owner', checkedOn: '2026-10-20', note: 'Checked.' }))
    expect(validateScene(scene)).toEqual([])
  })

  it('accepts a hub with no card or games, and rejects a hub that has them', () => {
    const hub = broken((s) => {
      s.hub = true
      delete s.card
      delete s.games
    })
    expect(validateScene(hub)).toEqual([])
    expect(validateScene(broken((s) => (s.hub = true)))).toContain('a hub has no "card" or "games"')
  })

  it("checks an exit's lockedNode", () => {
    const errors = validateScene(
      broken((s) => {
        s.hotspots.push({ id: 'door', x: 600, label: 'Door', kind: 'exit', to: 'park', lockedNode: 'nope' })
        s.hotspots[0].lockedNode = 'hello'
      }),
    )
    expect(errors).toContain('hotspot "door".lockedNode points to missing node "nope"')
    expect(errors.some((e) => e.endsWith('has a lockedNode but is not an exit'))).toBe(true)
  })

  it('rejects a quiz answer outside the options', () => {
    expect(validateScene(broken((s) => (s.games[0].questions[0].answer = 2)))).toContain(
      'quiz "test-quiz" question "q1".answer must be an index into options',
    )
  })

  it('rejects a quiz with only teen questions', () => {
    expect(validateScene(broken((s) => (s.games[0].questions[0].band = 'teen')))).toContain(
      'quiz "test-quiz" has no questions for young players',
    )
  })

  it('rejects a scene without a quiz', () => {
    expect(validateScene(broken((s) => (s.games = [])))).toContain('"games" must list at least one game')
  })
})

describe('NFR-09 content validation: UI strings', () => {
  it('finds t() keys in source code', () => {
    const code = `t('app.name'); t("nav.help", { a: 1 }); format('x'); t( 'menu.open' )`
    expect(findStringKeys(code)).toEqual(['app.name', 'nav.help', 'menu.open'])
  })

  it('reports keys used in code but missing from the strings file', () => {
    expect(validateStrings({ 'app.name': 'Saksham' }, ['app.name', 'nav.help'])).toEqual([
      `t('nav.help') is used in code but missing from the strings file`,
    ])
  })

  it('reports empty string values', () => {
    expect(validateStrings({ 'app.name': ' ' }, [])).toEqual(['string "app.name" must be non-empty text'])
  })
})

describe('NFR-06 Help Centre content', () => {
  it('the real help.json is valid', () => {
    expect(validateHelp(help)).toEqual([])
  })

  it('accepts only https Government of India pages as sources', () => {
    expect(isOfficialSource('https://112.gov.in')).toBe(true)
    expect(isOfficialSource('https://telemanas.mohfw.gov.in/home')).toBe(true)
    expect(isOfficialSource('https://rsdebate.nic.in/x.pdf')).toBe(true)
    expect(isOfficialSource('http://112.gov.in')).toBe(false)
    expect(isOfficialSource('https://en.wikipedia.org/wiki/112')).toBe(false)
    expect(isOfficialSource('https://fakegov.in')).toBe(false)
    expect(isOfficialSource('not a url')).toBe(false)
  })

  it('rejects a helpline without an official source or with a non-digit number', () => {
    const bad = structuredClone(help) as Loose
    bad.helplines[0].sources = [{ title: 'Blog', url: 'https://example.com' }]
    bad.helplines[1].number = '11-2'
    const errors = validateHelp(bad)
    expect(errors).toContain('helpline "child-helpline".sources[0] must be an https .gov.in or .nic.in page')
    expect(errors).toContain('helpline "emergency".number must be digits only')
  })
})

describe('NFR-07 content validation: people', () => {
  it('accepts known npcs, known speakers and the player', () => {
    const scene = broken((s) => (s.nodes.hello.speaker = 'player'))
    expect(validatePeople(scene, new Set(['ravi', 'mitthu']))).toEqual([])
  })

  it('rejects an unknown npc or speaker', () => {
    const scene = broken((s) => {
      s.hotspots[0].npc = 'ghost'
      s.nodes.good.speaker = 'stranger'
    })
    expect(validatePeople(scene, new Set(['ravi', 'mitthu']))).toEqual([
      'hotspot "friend" uses unknown npc "ghost"',
      'node "good" has unknown speaker "stranger"',
    ])
  })
})

describe('buildings list', () => {
  const good = [
    { id: 'school', name: 'The School', right: 'Education' },
    { id: 'park', name: 'Park', right: 'Play', teaser: true },
  ]

  it('accepts a valid list', () => {
    expect(validateBuildings(good)).toEqual([])
  })

  it('rejects duplicates, missing names and a teaser first', () => {
    const errors = validateBuildings([{ id: 'park', name: 'Park', right: 'Play', teaser: true }, { id: 'park', right: 'x' }])
    expect(errors).toContain('building "park" is duplicated')
    expect(errors).toContain('building "park" needs a "name" and a "right"')
    expect(errors).toContain('the first building must be playable (it is always unlocked)')
  })
})

describe('hub doors', () => {
  const hub = { hub: true, hotspots: [{ id: 'a', kind: 'exit', to: 'school' }, { id: 'b', kind: 'exit', to: 'help' }, { id: 'c', kind: 'exit', to: 'moon' }] }

  it('accept buildings and "help", and reject anything else', () => {
    expect(validateHubLinks(hub, new Set(['school']))).toEqual(['hub door "c" leads to "moon", which is not a building or "help"'])
  })

  it('ignore scenes that are not hubs', () => {
    expect(validateHubLinks({ ...hub, hub: false }, new Set())).toEqual([])
  })
})
