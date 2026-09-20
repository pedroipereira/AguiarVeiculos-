import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(__dirname, '../src/app/globals.css'), 'utf8')

/** The declarations inside the first rule that starts with this selector. */
function rule(selector: string) {
  const start = css.indexOf(selector)
  expect(start, `rule "${selector}" not found`).toBeGreaterThanOrEqual(0)
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
}

describe('.no-select', () => {
  it('blocks text selection, the long-press menu and the blue flash when tapping', () => {
    const declarations = rule('.no-select {')
    expect(declarations).toMatch(/-webkit-user-select:\s*none/)
    expect(declarations).toMatch(/(^|[^-])user-select:\s*none/)
    expect(declarations).toMatch(/-webkit-touch-callout:\s*none/)
    expect(declarations).toMatch(/-webkit-tap-highlight-color:\s*transparent/)
  })

  it('blocks pinch and double-tap zoom on touch screens', () => {
    expect(rule('.no-select {')).toMatch(/touch-action:\s*pan-x pan-y/)
  })

  it('does not let the visitor drag pictures out of the page', () => {
    expect(rule('.no-select img')).toMatch(/-webkit-user-drag:\s*none/)
  })

  it('still lets people select and type in form fields, which Safari would otherwise block', () => {
    const declarations = rule('.no-select input')
    expect(css).toMatch(/\.no-select input,\s*\.no-select textarea,\s*\.no-select select/)
    expect(declarations).toMatch(/-webkit-user-select:\s*text/)
    expect(declarations).toMatch(/(^|[^-])user-select:\s*text/)
  })
})
