const fs = require('fs')
const path = require('path')
const { challenges } = require('../lib/challenges/index')
const { bruteLimit } = require('../lib/solver/brute')
const { isReverseId1 } = require('../lib/rules')
const { fromDerivation } = require('../lib/render/code')
const { equalsDerivation } = require('../lib/model/derivation')

function countNodes(d: any): number {
  if (d.kind === 'premise') return 1
  return 1 + d.deps.reduce((s: number, c: any) => s + countNodes(c), 0)
}

const challengesDir = path.join(__dirname, '../src/challenges')

const fileMap = {}
for (const f of fs.readdirSync(challengesDir)) {
  if (!f.endsWith('.ts') || f === 'index.ts') continue
  const key = f.replace('.ts', '').replace(/-/g, '').toLowerCase()
  fileMap[key] = path.join(challengesDir, f)
}

const maxLimit = 12

let updated = 0
let missing = 0

for (const [name, challenge] of Object.entries(challenges)) {
  const { goal, rules, solution } = challenge as any
  const solverRules = rules.filter((r: string) => !isReverseId1(r))
  const found = bruteLimit({ goal, rules: solverRules }, maxLimit)

  if (found.length === 0) {
    console.log(`${name}: no proof found within limit ${maxLimit}`)
    missing += 1
    continue
  }

  const [optimal] = found
  if (equalsDerivation(solution, optimal)) continue
  if (countNodes(optimal) >= countNodes(solution)) continue

  const file = fileMap[name.toLowerCase()]
  if (!file) {
    console.log(`${name}: source file not found`)
    missing += 1
    continue
  }

  const content = fs.readFileSync(file, 'utf8')
  const newSolution = fromDerivation(optimal)
  const newContent = content.replace(
    /const solution = [\s\S]*?\n\nexport const/,
    `const solution = ${newSolution}\n\nexport const`,
  )

  if (newContent === content) {
    console.log(`${name}: could not replace solution (pattern mismatch)`)
    missing += 1
    continue
  }

  fs.writeFileSync(file, newContent)
  console.log(`${name}: updated`)
  updated += 1
}

if (updated > 0) console.log(`\n${updated} challenge(s) updated`)
if (missing > 0) console.log(`${missing} challenge(s) could not be resolved`)
if (updated === 0 && missing === 0) console.log('all challenges up to date')
