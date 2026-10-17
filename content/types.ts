// The content contract (BUILD_PLAN §6).
// Everything a scene needs lives in JSON that matches these types.
// The engine never refers to a building by id: it only reads these fields.
// scripts/validate-content.ts checks every scene file against these rules.

export type Tone = 'normal' | 'gentle'
export type Mood = 'neutral' | 'happy' | 'worried' | 'surprised' | 'sad'
export type Band = 'young' | 'teen'

export interface SceneDef {
  id: string // "school"
  title: string
  right: string
  tagline: string
  tone: Tone
  width: number // scene width in design units (wider than the screen)
  layers: Layer[]
  walkable: { minX: number; maxX: number }
  blockers?: { x1: number; x2: number }[]
  spawn: { x: number }
  ambience?: string // sound bed key
  hotspots: Hotspot[]
  objectives: Objective[]
  startNode: string
  intro?: string // node opened when the player arrives (Mitthu introduces the place)
  nodes: Record<string, StoryNode>
  /** Flags the hosting screen may set from saved progress (e.g. "done:school"), for showIf/hideIf and art. */
  hostFlags?: string[]
  /** A hub (the town) links to other places: it has no card or games and never "completes". */
  hub?: boolean
  card?: Card // required for every scene that is not a hub (checked by the validator)
  games?: GameDef[] // played in order after the card; must include a quiz; required unless hub
}

export interface Layer {
  id: string
  art: string
  speed: number // parallax factor, 1 = foreground; 0 = fixed to the screen (light, haze)
  front?: boolean // drawn in front of the characters (default: only layers faster than 1)
  drift?: boolean // slides slowly to and fro by itself (clouds); still in calm mode
}

export interface Hotspot {
  id: string
  x: number
  label: string
  kind: 'npc' | 'object' | 'exit'
  art?: string
  npc?: string // npc id for portraits and voice
  node?: string // story node to open
  showIf?: string[] // flags
  hideIf?: string[] // flags
  to?: string // exits: where the door leads. The screen hosting the scene decides what this means.
  lockedNode?: string // exits: node opened instead of leaving, while the host says this exit is locked
  depth?: number // 0 = the far edge of the walkway (against the wall) to 1 = nearest the viewer. Default: npc 0.35, others 0
}

export interface Objective {
  id: string
  text: string
  requires: string[] // flags that complete it
}

export interface StoryNode {
  id: string
  speaker: string
  text: string
  mood?: Mood
  set?: string[] // flags to set when shown
  next?: string
  choices?: Choice[]
  end?: 'good' | 'retry' // retry returns to the last choice node
  fx?: 'push' | 'cheer' | 'gasp' // optional; engine ignores unknown values
}

export interface Choice {
  label: string
  to: string
  kind?: 'good' | 'weak'
}

export interface Card {
  id: string
  title: string
  kid: string // text for the young band (8 to 11)
  teen: string // text for the teen band (12 to 16); "Tell me more" for young
  ifItHappens: string
  law: string // legal text, rendered exactly as written
  source: string // where the legal text comes from
  review: ContentReview // not shown: the owner's fact check of this card
}

/**
 * The owner's fact check of legal or safety content (BUILD_PLAN §10, §13). Not shown in the app.
 * `checks` lists every claim to verify, with the official source to verify it against.
 */
export interface ContentReview {
  status: 'unverified' | 'verified'
  checkedBy: string | null
  checkedOn: string | null
  note: string
  checks?: string[]
}

// Games, played in order after the card. Every building has a quiz; some add a sort game (D-041).
export type GameDef = QuizGame | SortGame

export interface QuizGame {
  kind: 'quiz'
  id: string
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  text: string
  options: string[]
  answer: number // index into options
  explanation: string // shown after answering, and first in the hint round
  band?: 'teen' // teen-only question; no band means everyone sees it
}

/** Sort each card into one of two boxes, by dragging it or tapping a box (FR-06, D-041). */
export interface SortGame {
  kind: 'sort'
  id: string
  prompt: string // what to do, e.g. "Is this allowed?"
  bins: [SortBin, SortBin] // exactly two boxes
  items: SortItem[] // everyone sorts every item, in this order
}

export interface SortBin {
  id: string
  label: string
}

export interface SortItem {
  id: string
  text: string
  bin: string // the id of the right box
  explanation: string // shown after placing it
}

// The town's buildings, in unlock order (content/buildings.json).
export interface BuildingInfo {
  id: string
  name: string // shown in the town
  right: string // the right it teaches, shown in the town
  teaser?: boolean // locked "Coming soon" building, never playable
  map: { x: number; y: number } // where its pin sits on the area map (1600 x 1000 drawing)
}

// The Help Centre (content/help.json). Every word shown comes from this file, exactly as written.
export interface HelpContent {
  title: string
  intro: string
  urgent: string // shown first: what to do if someone is in danger now
  helplinesTitle: string
  helplines: Helpline[]
  trustedAdult: { title: string; steps: string[] }
  rights: { title: string; items: string[] }
  disclaimer: string
  // Not shown in the app. Tracks the owner's fact-check of numbers and wording.
  review: ContentReview
}

export interface Helpline {
  id: string
  name: string
  number: string // digits only, used for the tel: link
  when: string // when to call, in a child's words
  hours: string
  sources: { title: string; url: string }[] // official pages that state this number
}

// The Community page (content/community.json, D-042). Every word shown comes from this file.
export interface CommunityContent {
  pledges: { id: string; text: string }[] // preset pledges only: children never write their own (safety rule)
  mission: { goal: string; target: number } // the cooperative class goal, in stars
  places: { id: string; name: string; what: string }[] // places that help
  // Not shown in the app. Tracks the owner's fact-check.
  review: ContentReview
}

// People (and Mitthu) who appear in scenes and dialogue (content/npcs.json).
// A hotspot's `npc` and a node's `speaker` refer to these ids; "player" means the child.
export interface NpcDef {
  name: string
  kind?: 'person' | 'parrot' // default person
  adult?: boolean // adults are drawn taller, with adult head proportions
  look?: Record<string, string | boolean> // a CharacterSpec; missing parts use defaults
}

// Credits (content/credits.json): shown on the Credits screen exactly as written.
// Keep in step with docs/ASSET_LICENSES.md.
export interface CreditsContent {
  fonts: { name: string; by: string; licence: string; use: string }[]
}
