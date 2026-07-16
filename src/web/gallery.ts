import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { createBareRuleCard, createButton, ghostToDerivation } from './game'
import { center, left, right } from '../rules'
import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import type { AnySequent } from '../model/sequent'
import { editDerivation, premise } from '../model/derivation'
import { computeGhostChain } from '../interactive/ghost'
import type { GhostKind } from '../interactive/ghost'
import { renderDerivation, layoutTree } from './tree'
import { fromDerivation } from '../render/print'
import type { GazeMark } from '../render/print'

// Design-system gallery, reached via the secret menu. Specimens are built with
// the production constructors and class names so they track the real styles.
// Like the system docs, the documentation prose stays English instead of
// entering the i18n catalogue; only the production button labels go through
// t() because they are localized in the game too.

const specimen = (el: HTMLElement, caption: string): HTMLElement => {
  const box = document.createElement('div')
  box.setAttribute('class', 'gallery-specimen')
  box.appendChild(el)
  const label = document.createElement('div')
  label.setAttribute('class', 'gallery-caption')
  label.textContent = caption
  box.appendChild(label)
  return box
}

const section = (
  title: string,
  prose: string,
  strip: HTMLElement,
): HTMLElement => {
  const sec = document.createElement('section')
  sec.setAttribute('class', 'gallery-section')
  const heading = document.createElement('div')
  heading.setAttribute('class', 'gallery-section-title')
  heading.textContent = title
  sec.appendChild(heading)
  const body = document.createElement('p')
  body.setAttribute('class', 'gallery-prose')
  body.textContent = prose
  sec.appendChild(body)
  sec.appendChild(strip)
  return sec
}

const metaSection = (): HTMLElement => {
  // The wrapper carries `bench-topbar` so the production descendant selectors
  // (.bench-topbar .quiz-menu-btn etc.) style the specimens.
  const strip = document.createElement('div')
  strip.setAttribute('class', 'gallery-strip bench-topbar')

  const menuBtn = document.createElement('div')
  menuBtn.setAttribute('class', 'button quiz-menu-btn')
  menuBtn.textContent = '⋮'
  strip.appendChild(specimen(menuBtn, t('menu')))

  const rulesOff = document.createElement('div')
  rulesOff.setAttribute('class', 'button toggle bench-rules-btn')
  rulesOff.textContent = '?'
  const ledOff = document.createElement('span')
  ledOff.setAttribute('class', 'led')
  rulesOff.appendChild(ledOff)
  strip.appendChild(specimen(rulesOff, t('rules') + ' · LED off'))

  const rulesOn = document.createElement('div')
  rulesOn.setAttribute('class', 'button toggle bench-rules-btn')
  rulesOn.textContent = '?'
  const ledOn = document.createElement('span')
  ledOn.setAttribute('class', 'led on')
  rulesOn.appendChild(ledOn)
  strip.appendChild(specimen(rulesOn, t('rules') + ' · LED on'))

  const zoomGroup = document.createElement('div')
  zoomGroup.setAttribute('class', 'bench-zoom')
  const zoomOut = createButton('−', false)
  zoomOut.classList.add('zoom-step')
  const zoomReset = createButton(':', false)
  zoomReset.classList.add('zoom-reset')
  const zoomIn = createButton('+', false)
  zoomIn.classList.add('zoom-step')
  zoomGroup.appendChild(zoomOut)
  zoomGroup.appendChild(zoomReset)
  zoomGroup.appendChild(zoomIn)
  strip.appendChild(specimen(zoomGroup, 'zoom'))

  return section(
    'Meta buttons',
    'Frameless icon buttons in the topbar for actions outside the game ' +
      'itself: opening the menu, toggling the rules sheet, zooming the proof ' +
      'tree. The transparent border makes them read as chrome rather than ' +
      'moves, and they hide entirely while a keyboard or gamepad is driving ' +
      'the game. The rules toggle carries an LED showing whether the sheet ' +
      'is open.',
    strip,
  )
}

const inertSection = (): HTMLElement => {
  const strip = document.createElement('div')
  strip.setAttribute('class', 'gallery-strip')

  const make = (label: string, disabled: boolean): HTMLElement => {
    const btn = createButton(label, disabled)
    btn.classList.add('inert')
    return btn
  }
  strip.appendChild(specimen(make(t('left'), false), 'default'))
  strip.appendChild(specimen(make(t('right'), false), 'default'))
  strip.appendChild(specimen(make(t('lemma'), false), 'default'))
  strip.appendChild(specimen(make(t('prevBranch'), true), 'disabled'))

  return section(
    'Inert buttons',
    'Bordered buttons navigate or select: they move the gaze cursor, switch ' +
      'branches, or open an editor. Pressing one never changes the proof, so ' +
      'the player can explore them without consequence.',
    strip,
  )
}

const mutatingSection = (): HTMLElement => {
  const strip = document.createElement('div')
  strip.setAttribute('class', 'gallery-strip')

  const make = (label: string, disabled: boolean): HTMLElement => {
    const btn = createButton(label, disabled)
    btn.classList.add('mutating')
    return btn
  }
  strip.appendChild(specimen(make(t('drop'), false), 'default'))
  strip.appendChild(specimen(make(t('destruct'), false), 'default'))
  strip.appendChild(specimen(make(t('axiom'), false), 'default'))
  strip.appendChild(specimen(make(t('undo'), true), 'disabled'))

  return section(
    'Mutating buttons',
    'Solid buttons commit a move: applying a rule, undoing one, skipping the ' +
      'challenge. The filled body signals that game state changes when the ' +
      'button is pressed.',
    strip,
  )
}

const ruleCardSection = (): HTMLElement => {
  const strip = document.createElement('div')
  strip.setAttribute('class', 'gallery-strip')

  strip.appendChild(specimen(createBareRuleCard('i', center.i, false), 'axiom'))
  strip.appendChild(
    specimen(createBareRuleCard('swl', left.swl, false), 'structural'),
  )
  strip.appendChild(
    specimen(createBareRuleCard('ir', right.ir, false), 'logical'),
  )
  strip.appendChild(
    specimen(createBareRuleCard('cut', center.cut, false), 'meta'),
  )
  strip.appendChild(
    specimen(createBareRuleCard('nl', left.nl, true), 'disabled'),
  )

  return section(
    'Rule cards',
    'Rule cards are not buttons: they are a non-interactive display of each ' +
      'rule schema, addressed to specialists who already read the notation. ' +
      'Together the cards give a concise description of the proof system. ' +
      'A dimmed card means the rule is not available in the current ' +
      'challenge. In play the cards may carry key and gaze badges; those are ' +
      'documented with the input hints, not here.',
    strip,
  )
}

const treeSpecimen = (el: HTMLElement, caption: string): HTMLElement => {
  const wrap = document.createElement('div')
  wrap.setAttribute('class', 'gallery-tree')
  wrap.appendChild(el)
  return specimen(wrap, caption)
}

const treeSection = (): HTMLElement => {
  const strip = document.createElement('div')
  strip.setAttribute('class', 'gallery-strip')

  // The same small proof as challenge ch6-branching-2: p, q ⊢ p ∧ q.
  const { a, z, i } = rk
  const proof = z.cr(
    z.swl(a('q'), i.i(a('p'))),
    z.sRotLB(z.swl(a('p'), i.i(a('q')))),
  )
  // Mid-solve state: the right branch reopened into an active goal.
  const partial = editDerivation(proof, [1], (d) => premise(d.result))
  if (partial !== null) {
    strip.appendChild(
      treeSpecimen(renderDerivation(partial, [1]), 'in progress'),
    )
  }
  strip.appendChild(treeSpecimen(renderDerivation(proof, [-1]), 'solved'))

  return section(
    'Proof tree',
    'The proof tree is the play surface. The goal sequent sits at the ' +
      'bottom; each backward rule application draws an inference line above ' +
      'its conclusion, labelled with the rule on the right, and stacks the ' +
      'new premises on top. The highlighted sequent is the active goal that ' +
      'the next move applies to; a solved tree has no open goals left. The ' +
      'solve animation states (verify sweep, fading) are not documented ' +
      'here.',
    strip,
  )
}

const gazeGhostSection = (): HTMLElement => {
  const strip = document.createElement('div')
  strip.setAttribute('class', 'gallery-strip')

  const { a, o } = rk
  const goal = sequent(
    [o.p2.conjunction(a('p'), a('q'))],
    [o.p2.conjunction(a('q'), a('p'))],
  )
  const gaze: GazeMark = { side: 'left', index: 0 }

  strip.appendChild(
    treeSpecimen(renderDerivation(premise(goal), [], gaze), 'gaze cursor'),
  )

  const ghostSpecimen = (
    kind: GhostKind,
    caption: string,
    seq: AnySequent = goal,
    mark: GazeMark = gaze,
  ): HTMLElement | null => {
    const chain = computeGhostChain(seq, mark, kind, rules)
    if (chain === null) return null
    const tree = renderDerivation(
      ghostToDerivation(chain, seq),
      [],
      mark,
      [],
      [],
    )
    return treeSpecimen(tree, caption)
  }

  const destruct = ghostSpecimen('connective', t('destruct') + ' ghost')
  if (destruct !== null) strip.appendChild(destruct)
  const drop = ghostSpecimen('weakening', t('drop') + ' ghost')
  if (drop !== null) strip.appendChild(drop)

  // Gazing a formula that is not in the active position: the ghost chain
  // includes the rotations needed to bring it there.
  const rotated = ghostSpecimen(
    'connective',
    'ghost with rotation',
    sequent([o.p2.conjunction(a('p'), a('q')), a('r')], [a('s')]),
    { side: 'left', index: 0 },
  )
  if (rotated !== null) strip.appendChild(rotated)

  return section(
    'Gaze ghost',
    'With the gaze cursor on a formula (underlined), the tree previews what ' +
      'the pending verb would do: the premises that Destruct or Drop would ' +
      'create appear as a dimmed blue ghost above the active sequent, ' +
      'inference line included. When the gazed formula is not in the active ' +
      'position, the ghost also shows the rotations needed to bring it ' +
      'there. Nothing is applied until the verb is pressed. The Claim (cut) ' +
      'ghost and the presolve display are still in flux and intentionally ' +
      'undocumented.',
    strip,
  )
}

type Swatch = {
  label: string
  css: string
  value: string
  note: string
}

// Only --gaze-color and --branch-color are named custom properties; the other
// values are transcribed from lk.css literals and can drift — the stylesheet
// stays the source of truth.
const swatches: Swatch[] = [
  {
    label: 'paper',
    css: '#ffeedd',
    value: '#ffeedd',
    note: 'page background, overlays; text on mutating buttons (#fed)',
  },
  {
    label: 'ink',
    css: '#000',
    value: '#000',
    note: 'text, borders, mutating button fill',
  },
  {
    label: 'button fill',
    css: '#fff8',
    value: '#fff8',
    note: 'inert/meta button body; opaque #fff on hover',
  },
  {
    label: 'gaze',
    css: 'var(--gaze-color)',
    value: '--gaze-color · #48f',
    note: 'gaze cursor underline; gaze controls group',
  },
  {
    label: 'branch',
    css: 'var(--branch-color)',
    value: '--branch-color · #fca',
    note: 'branch controls group; rule-card key badges',
  },
  {
    label: 'goal highlight',
    css: '#fcaa',
    value: '#fcaa',
    note: 'active sequent in the tree — the branch color at ⅔ alpha',
  },
  {
    label: 'selection',
    css: '#f80',
    value: '#f80',
    note: 'button cursor outline; active toggle border (fill #ffeedd)',
  },
  {
    label: 'hot',
    css: '#c33',
    value: '#c33',
    note: 'gaze controls group while the cursor is parked',
  },
  {
    label: 'LED on',
    css: '#f22',
    value: '#f22',
    note: 'toggle LED lit (plus glow)',
  },
  {
    label: 'LED off',
    css: '#400',
    value: '#400',
    note: 'toggle LED dark',
  },
  {
    label: 'keycap',
    css: '#36c',
    value: '#36c',
    note: 'cold key-hint badges (input hints get their own chapter later)',
  },
  {
    label: 'card',
    css: '#d4b896',
    value: '#d4b896',
    note: 'rule card body',
  },
  {
    label: 'card border',
    css: '#8a6f4a',
    value: '#8a6f4a',
    note: 'rule card border',
  },
  {
    label: 'card text',
    css: '#3a2a14',
    value: '#3a2a14',
    note: 'rule card schema text',
  },
]

const fontsSection = (): HTMLElement => {
  const strip = document.createElement('div')
  strip.setAttribute('class', 'gallery-strip gallery-strip-top')

  const sans = document.createElement('div')
  sans.setAttribute('class', 'gallery-type-sample')
  for (const weight of [300, 400, 700]) {
    const line = document.createElement('div')
    line.style.fontWeight = String(weight)
    line.textContent = `Drop · Destruct · Close · Claim (${String(weight)})`
    sans.appendChild(line)
  }
  strip.appendChild(specimen(sans, 'Noto Sans · variable 100–900'))

  const math = document.createElement('div')
  math.setAttribute('class', 'gallery-type-sample')
  math.textContent = 'Γ, Δ ⊢ ¬(p → q) ∧ ⊥ ∨ ⊤'
  strip.appendChild(specimen(math, 'Noto Sans Math · logic glyphs'))

  const mono = document.createElement('pre')
  mono.setAttribute('class', 'gallery-mono-sample')
  mono.textContent = fromDerivation(
    right.ir.example,
    t('sideLeft'),
    t('sideRight'),
    true,
  )
  strip.appendChild(specimen(mono, 'system monospace · schema grid'))

  return section(
    'Fonts',
    'Two typefaces load from Google Fonts. Noto Sans, a variable font ' +
      '(weights 100–900, with italics), sets all UI text. Noto Sans Math ' +
      'sits behind it in the font stack: wherever Noto Sans lacks a glyph — ' +
      'the turnstile and the connectives — the character falls through to ' +
      'the math font, so logic notation in the proof tree is a fallback ' +
      'effect, not a separate style. Button labels, rule cards and the ' +
      'system docs are pre elements and render in the platform default ' +
      'monospace; the schema pretty-printer aligns its layouts on the ' +
      'character grid, so monospace is a functional requirement there, not ' +
      'a taste. The bird emoji standing in for atoms come from the platform ' +
      'color-emoji font — placeholders until the game gets real graphics, ' +
      'deliberately unspecified.',
    strip,
  )
}

const colorsSection = (): HTMLElement => {
  const strip = document.createElement('div')
  strip.setAttribute('class', 'gallery-strip gallery-strip-top')

  for (const s of swatches) {
    const box = document.createElement('div')
    box.setAttribute('class', 'gallery-specimen')
    const block = document.createElement('div')
    block.setAttribute('class', 'gallery-swatch')
    block.style.backgroundColor = s.css
    box.appendChild(block)
    const label = document.createElement('div')
    label.setAttribute('class', 'gallery-caption')
    label.textContent = s.label
    box.appendChild(label)
    const value = document.createElement('div')
    value.setAttribute('class', 'gallery-caption')
    value.textContent = s.value
    box.appendChild(value)
    const note = document.createElement('div')
    note.setAttribute('class', 'gallery-swatch-note')
    note.textContent = s.note
    box.appendChild(note)
    strip.appendChild(box)
  }

  return section(
    'Colors',
    'The game is drawn in ink on parchment; interactive chrome adds ' +
      'translucent whites, and a small set of accents carries meaning: blue ' +
      'for the gaze, peach for branches, orange for selection, red for hot ' +
      'and lit states. Ghost and solved trees are not separate pigments — ' +
      'they are CSS filters over these same colors. Only the gaze and ' +
      'branch accents are named custom properties; the other values are ' +
      'transcribed literals, so treat lk.css as the source of truth.',
    strip,
  )
}

export const mountGallery = (
  container: HTMLElement,
  navigate: Navigate,
): MountResult => {
  const render = () => {
    container.innerHTML = ''
    const panel = document.createElement('div')
    panel.setAttribute('class', 'gallery')

    const back = document.createElement('div')
    back.setAttribute('class', 'button system-back')
    back.innerHTML = t('back')
    back.onclick = () => navigate('secret')
    panel.appendChild(back)

    const title = document.createElement('div')
    title.setAttribute('class', 'system-title')
    title.innerHTML = t('gallery')
    panel.appendChild(title)

    const doc = document.createElement('div')
    doc.setAttribute('class', 'gallery-doc')
    doc.appendChild(metaSection())
    doc.appendChild(inertSection())
    doc.appendChild(mutatingSection())
    doc.appendChild(ruleCardSection())
    doc.appendChild(treeSection())
    doc.appendChild(gazeGhostSection())
    doc.appendChild(colorsSection())
    doc.appendChild(fontsSection())
    panel.appendChild(doc)

    container.appendChild(panel)
    requestAnimationFrame(() => {
      const trees = panel.querySelectorAll<HTMLElement>(
        '.gallery-tree > .tree-node',
      )
      trees.forEach((tree) => layoutTree(tree, { skipActiveScroll: true }))
    })
  }

  render()
  return { cleanup: () => {}, rerender: render }
}
