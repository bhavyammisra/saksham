// Which English content file each Hindi overlay translates (D-054). Shared by the app's validator,
// tests and scripts/hindi-todo.ts. `also` lists fields that are text only in that file.

export const CONTENT_OVERLAYS: { english: string; hindi: string; also?: string[] }[] = [
  ...['town', 'school', 'dhaba', 'home', 'panchayat'].map((id) => ({ english: `content/scenes/${id}.json`, hindi: `content/hi/scenes/${id}.json` })),
  { english: 'content/buildings.json', hindi: 'content/hi/buildings.json' },
  { english: 'content/npcs.json', hindi: 'content/hi/npcs.json' },
  { english: 'content/help.json', hindi: 'content/hi/help.json', also: ['intro'] },
  { english: 'content/community.json', hindi: 'content/hi/community.json' },
]
