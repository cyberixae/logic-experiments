export type Segment = {
  text: string
  active: boolean
}

export type Segments = Array<Segment>

export function of(text: string): Segment {
  return { text, active: false }
}

export function active(text: string): Segment {
  return { text, active: true }
}

export function plain(segments: Segments): string {
  return segments.map((s) => s.text).join('')
}

export function ansi(segments: Segments): string {
  return segments
    .map((s) => (s.active ? `\x1b[1m${s.text}\x1b[0m` : s.text))
    .join('')
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function html(segments: Segments): string {
  return segments
    .map((s) =>
      s.active
        ? `<span class="connective-active">${escape(s.text)}</span>`
        : escape(s.text),
    )
    .join('')
}

export function trim(segments: Segments): Segments {
  const result = [...segments]
  for (let i = 0; i < result.length; i += 1) {
    const s = result[i]
    if (s === undefined) break
    const trimmed = s.text.trimStart()
    result[i] = { ...s, text: trimmed }
    if (trimmed.length > 0) break
  }
  for (let i = result.length - 1; i >= 0; i -= 1) {
    const s = result[i]
    if (s === undefined) break
    const trimmed = s.text.trimEnd()
    result[i] = { ...s, text: trimmed }
    if (trimmed.length > 0) break
  }
  return result
}
