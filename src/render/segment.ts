export type Segment = {
  text: string
  active: boolean
  connective: boolean
  parenthesis?: boolean
  raw?: boolean
}

export type Segments = Array<Segment>

export function of(text: string): Segment {
  return { text, active: false, connective: false }
}

export function active(text: string): Segment {
  return { text, active: true, connective: false }
}

export function connective(text: string, active: boolean): Segment {
  return { text, active, connective: true }
}

export function paren(text: string): Segment {
  return { text, active: false, connective: false, parenthesis: true }
}

export function raw(html: string): Segment {
  return { text: html, active: false, connective: false, raw: true }
}

export function plain(segments: Segments): string {
  return segments.map((s) => (s.raw === true ? '' : s.text)).join('')
}

export function ansi(segments: Segments): string {
  return segments
    .map((s) =>
      s.raw === true ? '' : s.active ? `\x1b[1m${s.text}\x1b[0m` : s.text,
    )
    .join('')
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function html(segments: Segments): string {
  return segments
    .map((s) => {
      if (s.raw === true) {
        return s.text
      }
      if (s.connective) {
        const cls = s.active ? 'connective active' : 'connective'
        return `<span class="${cls}">${escape(s.text)}</span>`
      }
      if (s.parenthesis === true) {
        return `<span class="parenthesis">${escape(s.text)}</span>`
      }
      return escape(s.text)
    })
    .join('')
}

export function trim(segments: Segments): Segments {
  const result = [...segments]
  for (let i = 0; i < result.length; i += 1) {
    const s = result[i]
    if (s === undefined) break
    if (s.raw === true) continue
    const trimmed = s.text.trimStart()
    result[i] = { ...s, text: trimmed }
    if (trimmed.length > 0) break
  }
  for (let i = result.length - 1; i >= 0; i -= 1) {
    const s = result[i]
    if (s === undefined) break
    if (s.raw === true) continue
    const trimmed = s.text.trimEnd()
    result[i] = { ...s, text: trimmed }
    if (trimmed.length > 0) break
  }
  return result
}
