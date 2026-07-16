import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { createBareRuleCard, createButton } from './game'
import { center, left, right } from '../rules'

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
    panel.appendChild(doc)

    container.appendChild(panel)
  }

  render()
  return { cleanup: () => {}, rerender: render }
}
