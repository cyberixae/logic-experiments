import { NonEmptyArray, isNonEmptyArray } from './array'

const space = ' '

function split(s: string, d: string): NonEmptyArray<string> {
  const parts = s.split(d)
  if (isNonEmptyArray(parts)) {
    return parts
  }
  return [s]
}

export function align(a: string, b: string) {
  const last = lastLine(a)
  if (last.trim().length < 1) {
    return null
  }
  const [first, ...rest] = split(b, '\n')
  if (first.trim() !== last.trim()) {
    return null
  }
  const topLeft = Math.abs(last.trimStart().length - last.length)
  const topRight = Math.abs(last.trimEnd().length - last.length)
  const bottomLeft = Math.abs(first.trimStart().length - first.length)
  const bottomRight = Math.abs(first.trimEnd().length - first.length)

  const top = margin(
    Math.max(0, bottomLeft - topLeft),
    Math.max(0, bottomRight - topRight),
  )(a)
  const bot = margin(
    Math.max(0, topLeft - bottomLeft),
    Math.max(0, topRight - bottomRight),
  )(rest.join('\n'))

  return [...top.split('\n'), ...bot.split('\n')].join('\n')
}

function margin(left: number, right: number = 0, space: string = ' ') {
  return (str: string) => {
    return str
      .split('\n')
      .map((line) => space.repeat(left) + line + space.repeat(right))
      .join('\n')
  }
}

function width(str: string): number {
  return Math.max(...str.split('\n').map((line) => line.length))
}

function left(wide: number): (s: string) => string {
  return (str) => {
    const length = width(str)
    const rightMargin = Math.max(0, wide - length)
    return margin(0, rightMargin, ' ')(str)
  }
}

export function concat(str1: string, str2: string): string {
  const lines1 = str1.split('\n').reverse()
  const width1 = width(str1)
  const lines2 = str2.split('\n').reverse()
  const width2 = width(str2)
  const count = Math.max(lines1.length, lines2.length)
  return 'x'
    .repeat(count)
    .split(String())
    .map(
      (_, i) =>
        left(width1)(lines1[i] ?? String()) +
        left(width2)(lines2[i] ?? String()),
    )
    .reverse()
    .join('\n')
}

export function center(wide: number): (s: string) => string {
  return (str) => {
    const length = width(str)
    const leftMargin = Math.max(0, Math.floor((wide - length) / 2))
    const rightMargin = Math.max(0, wide - length - leftMargin)
    return margin(leftMargin, rightMargin, ' ')(str)
  }
}

function line(width: number) {
  return '\u2015'.repeat(width)
}
function pad(str: string): string {
  const length = width(str)
  const lines = str.split('\n')
  return lines.map((line) => line.padEnd(length, space)).join('\n')
}

export function spaced(blocks: Array<string>, n: number = 1) {
  const [first, ...rest] = blocks
  if (typeof first !== 'string') {
    return ''
  }
  return rest.map(margin(n, 0)).reduce(concat, first)
}

export const br = String()

export function centerify(...lines: Array<string>) {
  const max = Math.max(...lines.map(width))
  return lines.map(center(max)).join('\n')
}
export function leftify(...lines: Array<string>) {
  return lines.join('\n')
}

export function tree(
  root: string,
  branches: Array<string>,
  note: string,
  lineWidth: number,
): string {
  const line1 = center(lineWidth)(spaced(branches, 2))
  const last = center(lineWidth)(lastLine(line1).trim())
  const line2 = spaced([line(lineWidth), note])
  const line3 = center(lineWidth)(root)

  const aligned = align(line1, pad(leftify(last, line2, line3)))
  if (aligned) {
    return aligned
  }
  return pad(leftify(line1, line2, line3))
}

function lastLine(block: string): string {
  const [first, ...rest] = split(block, '\n')
  return rest.at(-1) ?? first
}

export function treeAuto(
  root: string,
  branches: Array<string>,
  note: string,
): string {
  const branchBlock = spaced(branches, 2)
  const contentWidth = Math.max(
    lastLine(branchBlock).trim().length + 2,
    width(root) + 2,
  )
  return tree(root, branches, note, contentWidth)
}

const quote = ''

export function log(str: string = String()) {
  for (const line of str.split('\n')) {
    console.log('  ' + quote + line.trimEnd() + quote)
  }
}

export const underline = (char: string) => (str: string) =>
  [...str.split('\n'), char.repeat(width(str))].join('\n')
