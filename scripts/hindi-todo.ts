// Lists every English text that has no Hindi yet, file by file (BUILD_PLAN P6, D-054).
// Run: node scripts/hindi-todo.ts            (a count per file)
//      node scripts/hindi-todo.ts --json     (the missing texts themselves, to translate)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { textPaths } from '../src/lib/localize.ts'
import { CONTENT_OVERLAYS } from '../src/lib/overlays.ts'

const root = join(fileURLToPath(import.meta.url), '..', '..')
const read = (file: string) => JSON.parse(readFileSync(join(root, file), 'utf8'))

const missing: Record<string, Record<string, string>> = {}
let total = 0
for (const { english, hindi, also } of CONTENT_OVERLAYS) {
  const done = existsSync(join(root, hindi)) ? read(hindi) : {}
  const todo = Object.fromEntries([...textPaths(read(english), also)].filter(([path]) => !done[path]))
  missing[hindi] = todo
  total += Object.keys(todo).length
}
const en = read('content/strings.en.json')
const hi = existsSync(join(root, 'content/strings.hi.json')) ? read('content/strings.hi.json') : {}
missing['content/strings.hi.json'] = Object.fromEntries(Object.entries(en).filter(([key]) => !hi[key])) as Record<string, string>
total += Object.keys(missing['content/strings.hi.json']).length

if (process.argv.includes('--json')) console.log(JSON.stringify(missing, null, 2))
else {
  for (const [file, todo] of Object.entries(missing)) console.log(`${file}: ${Object.keys(todo).length} to translate`)
  console.log(`Total: ${total}`)
}
