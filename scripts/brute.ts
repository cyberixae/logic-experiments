const fs = require('fs')
const path = require('path')
const { challenges } = require('../lib/challenges/index')
const { bruteLimit } = require('../lib/solver/brute')
const { fromDerivation } = require('../lib/render/code')
const { equalsDerivation } = require('../lib/model/derivation')

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
  const found = bruteLimit({ goal, rules }, maxLimit)

  if (found.length === 0) {
    console.log(`${name}: no proof found within limit ${maxLimit}`)
    missing++
    continue
  }

  const [optimal] = found
  if (equalsDerivation(solution, optimal)) continue

  const file = fileMap[name.toLowerCase()]
  if (!file) {
    console.log(`${name}: source file not found`)
    missing++
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
    missing++
    continue
  }

  fs.writeFileSync(file, newContent)
  console.log(`${name}: updated`)
  updated++
}

if (updated > 0) console.log(`\n${updated} challenge(s) updated`)
if (missing > 0) console.log(`${missing} challenge(s) could not be resolved`)
if (updated === 0 && missing === 0) console.log('all challenges up to date')
