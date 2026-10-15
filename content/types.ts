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
  card: Card
  games: GameDef[] // quiz first, sort later
}

export interface Layer {
  id: string
  art: string
  speed: number // parallax factor, 1 = foreground; 0 = fixed to the screen (light, haze)
  front?: boolean // drawn in front of the characters (default: only layers faster than 1)
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

// Games. The quiz comes first; the sort game is added in Phase 4.
export type GameDef = QuizGame

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

// The town's buildings, in unlock order (content/buildings.json).
export interface BuildingInfo {
  id: string
  teaser?: boolean // locked "Coming soon" building, never playable
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

// People (and Mitthu) who appear in scenes and dialogue (content/npcs.json).
// A hotspot's `npc` and a node's `speaker` refer to these ids; "player" means the child.
export interface NpcDef {
  name: string
  kind?: 'person' | 'parrot' // default person
  adult?: boolean // adults are drawn taller, with adult head proportions
  look?: Record<string, string | boolean> // a CharacterSpec; missing parts use defaults
}
