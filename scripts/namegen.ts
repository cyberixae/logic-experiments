const colors = [
  'harmaa',
  'keltainen',
  'oranssi',
  'punainen',
  'ruskea',
  'sininen',
  'syaani',
  'turkoosi',
  'violetti',
]
const greens = [
  'ananas',
  'aprikoosi',
  'banaani',
  'fenkoli',
  'karpalo',
  'kirsikka',
  'kookos',
  'kurkku',
  'luumu',
  'mango',
  'munakoiso',
  'mustikka',
  'nektariini',
  'oliivi',
  'omena',
  'paprika',
  'persikka',
  'peruna',
  'pomelo',
  'porkkana',
  'puolukka',
  'retiisi',
  'selleri',
  'sipuli',
  'sitruuna',
  'tomaatti',
]
const animals = [
  'ahma',
  'alpakka',
  'biisoni',
  'hirvi',
  'kameli',
  'kauris',
  'kenguru',
  'kettu',
  'kirahvi',
  'koala',
  'leijona',
  'lepakko',
  'okapi',
  'oranki',
  'panda',
  'pantteri',
  'puuma',
  'seepra',
  'tapiiri',
  'tiikeri',
  'virtahepo',
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const gen = () => [colors, greens, animals].map(pick).join('-')

console.log(
  Array(10)
    .fill(0)
    .map(() => gen())
    .join('\n'),
)
