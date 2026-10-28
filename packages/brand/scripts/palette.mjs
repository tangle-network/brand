// Palette inputs and role derivation. gen-ladders.mjs is the only writer.
// L is OKLCH lightness ×100. Dark chroma grows with L; light chroma recedes
// toward paper. Ink stays neutral, leaving the accent to signal interaction.
import { hslHex } from './css-resolve.mjs'

// hue, chroma, [page, chrome, card, raised, overlay, hairline, backdrop], accent hue
const CACHE = new Map()
const THEMES = {
  dark: [287, .137, [15, 18.5, 21.7, 26.6, 31.6, 34.1, 10.8], 246],
  light: [274, .008, [94.9, 97.2, 100, 95.2, 100, 83.5, 90.2], 246],
  aubergine: [295, .25, [20.5, 25.2, 29.9, 34.6, 39.3, 42, 15.8], 258],
  'aubergine-light': [299, .017, [95.5, 98, 100, 95.2, 100, 86, 90.5], 258],
  arena: [171, .055, [17.5, 22.2, 26.9, 31.6, 36.3, 39, 12.8], 160],
  'arena-light': [165, .012, [95.5, 98, 100, 95.2, 100, 86, 90.5], 160],
  super: [145, .065, [19.7, 24.4, 29.1, 33.8, 38.5, 41, 15], 148],
  'super-light': [122, .009, [95.5, 98, 100, 95.2, 100, 86, 90.5], 148],
  'tangle-light': [286, .01, [95.5, 98, 100, 95.2, 100, 86, 90.5], 246],
  intelligence: [301.5, .095, [15, 19.7, 24.4, 29.1, 33.8, 37, 10.3], 246],
  hospitality: [151, .03, [16.9, 21.6, 31.1, 37.9, 42, 42, 12.4], 153],
  'hospitality-light': [140, .016, [91.6, 96.9, 100, 95.5, 100, 85, 88], 153],
  agents: [308, .022, [18, 22.7, 27.4, 32.1, 36.8, 40, 13.3], 246],
  'agents-light': [318, .006, [100, 98, 100, 95.2, 100, 86, 90.5], 246],
  website: [284, .225, [16.2, 20.9, 25.6, 30.3, 35, 39, 11.5], 246],
  'website-light': [286, .012, [95.5, 98, 100, 95.2, 100, 86, 90.5], 246],
}
export const CATEGORY = { violet: 272, orange: 22, teal: 172, blue: 209, pink: 322, brown: 24, cyan: 192, lime: 84 }
const STATUS = { success: 155, warning: 38, danger: 0, info: 201 }
const WHITE = '#ffffff'
const BLACK = '#000000'
export const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
export const hexOf = (channels) => '#' + channels.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('')
const linear = (v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4
export const luminance = (hex) => rgb(hex).map(linear).reduce((v, c, i) => v + c * [.2126, .7152, .0722][i], 0)
export const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)
export const mix = (a, b, t) => hexOf(rgb(a).map((v, i) => v * t + rgb(b)[i] * (1 - t)))
export function hsl(hex) {
  const [r, g, b] = rgb(hex), hi = Math.max(r, g, b), lo = Math.min(r, g, b), d = hi - lo, l = (hi + lo) / 2
  const hue = !d ? 0 : 60 * (hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4)
  const round = (n) => +n.toFixed(4)
  return `${round(hue)} ${round(d ? d / (1 - Math.abs(2 * l - 1)) * 100 : 0)}% ${round(l * 100)}%`
}
export function lch(L, C, hue) {
  const a = C * Math.cos(hue * Math.PI / 180), b = C * Math.sin(hue * Math.PI / 180)
  const l = (L / 100 + .3963377774 * a + .2158037573 * b) ** 3
  const m = (L / 100 - .1055613458 * a - .0638541728 * b) ** 3
  const s = (L / 100 - .0894841775 * a - 1.291485548 * b) ** 3
  const encode = (c) => c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055
  return hexOf([4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s].map(encode))
}
// Search quantized sRGB, the actual output gamut. Every contrast target has
// rounding headroom; no browser-dependent gamut clipping is needed at runtime.
function solve(make, accepts, descending = false) {
  for (let n = 0; n <= 10000; n++) {
    const value = make((descending ? 10000 - n : n) / 100)
    if (accepts(value)) return value
  }
  throw new Error('Palette has no colour satisfying its contrast target')
}
const inkOn = (planes, target, dark, make = (L) => hslHex(0, 0, L)) => solve(make, (c) => planes.every((p) => contrast(c, p) >= target), !dark)
const colour = (hue, sat, L) => hslHex(hue, sat, L)
const hueInk = (hue, sat, planes, target, dark) => inkOn(planes, target, dark, (L) => colour(hue, sat, L))
const alpha = (hex, opacity) => `rgb(${rgb(hex).map((c) => Math.round(c * 255)).join(' ')} / ${opacity})`

export function palette(name) {
  if (CACHE.has(name)) return CACHE.get(name)
  const [hue, chroma, levels, accentHue] = THEMES[name]
  const dark = name !== 'light' && !name.endsWith('-light')
  const plane = (L) => lch(L, L === 100 ? 0 : dark ? chroma * L / 100 : chroma, hue)
  const [page, chrome, card, raised, overlay, hairline, backdrop] = levels.map(plane)
  const planes = [page, chrome, card, raised, overlay, ...(name === 'hospitality' ? [plane(43.9)] : [])]
  const dim = inkOn(planes, 4.58, dark)
  const muted = inkOn([...planes, dim], 1.22, dark, (L) => {
    const c = colour(0, 0, L)
    return planes.every((p) => contrast(c, p) >= 5.55) ? c : dim
  })
  const secondary = inkOn(planes, 6.85, dark)
  const primary = inkOn(planes, Math.min(9, ...planes.map((p) => contrast(dark ? WHITE : BLACK, p) - .15)), dark)
  const fill = solve((L) => colour(accentHue, 54, L), (c) => contrast(WHITE, mix(WHITE, c, .1)) >= 4.7, true)
  const accent = hueInk(accentHue, 92, [...planes, ...planes.map((p) => mix(fill, p, .2))], 4.65, dark)
  const mark = colour(accentHue, 85, dark ? 70 : 64)
  const line = hueInk(accentHue, 85, planes, 3.5, dark)
  const h = (token) => `hsl(var(--${token}))`
  const v = (token) => `var(--${token})`
  const out = {
    'hsl-background': hsl(page), 'hsl-card': hsl(card), 'hsl-secondary': hsl(raised), 'hsl-muted': v('hsl-secondary'),
    'hsl-popover': hsl(overlay), 'hsl-input': hsl(chrome), 'hsl-accent': v('hsl-secondary'),
    'hsl-border': hsl(hairline), 'hsl-foreground': hsl(primary), 'hsl-muted-foreground': hsl(muted),
    'hsl-primary': hsl(fill), 'hsl-ring': hsl(dark ? accent : fill), 'hsl-primary-foreground': '0 0% 100%',
    'text-primary': h('hsl-foreground'), 'text-secondary': secondary, 'text-muted': muted, 'text-dim': dim,
    'md3-outline': h('hsl-muted-foreground'), 'md3-outline-variant': h('hsl-border'),
    'md3-surface': h('hsl-background'), 'md3-surface-dim': backdrop, 'md3-surface-bright': h('hsl-popover'),
    'md3-surface-container-lowest': dark ? v('md3-surface-dim') : h('hsl-card'),
    'md3-surface-container-low': h('sidebar-background'), 'md3-surface-container': h('hsl-card'),
    'md3-surface-container-high': h('hsl-secondary'), 'md3-surface-container-highest': h('hsl-popover'),
    'md3-surface-variant': v('md3-surface-container-high'), 'md3-on-surface': v('text-primary'), 'md3-on-surface-variant': v('text-muted'),
    'sidebar-background': name === 'dark' ? v('hsl-input') : name === 'light' ? v('hsl-card') : hsl(chrome),
    'sidebar-accent': v('hsl-secondary'), 'sidebar-border': v('hsl-border'), 'sidebar-foreground': v('hsl-foreground'),
    'sidebar-primary': v('hsl-primary'), 'sidebar-primary-foreground': v('hsl-primary-foreground'), 'sidebar-ring': v('hsl-ring'),
    'sidebar-accent-foreground': v('hsl-foreground'),
    'brand-primary': mark, 'brand-cool': line, 'accent-text': accent,
    'brand-glow': v('accent-text'), 'brand-vibrant': v('brand-primary'),
    'brand-purple': mix(WHITE, accent, .35), 'brand-strong': mix(BLACK, fill, .5),
    'brand-strong-text': WHITE, 'btn-primary-bg': h('hsl-primary'), 'btn-primary-hover': mix(WHITE, fill, .1),
    'btn-primary-text': WHITE, 'btn-cta-bg': v('btn-primary-bg'), 'btn-cta-text': v('btn-primary-text'),
    'md3-primary': v('accent-text'), 'md3-primary-dim': v('btn-primary-bg'), 'md3-primary-container': v('btn-primary-bg'),
    'md3-on-secondary': dark ? v('brand-purple') : WHITE, 'md3-on-primary': WHITE, 'md3-on-primary-container': dark ? v('brand-purple') : WHITE,
    'md3-primary-fixed': dark ? v('accent-text') : mix(accent, WHITE, .12),
    'md3-inverse-primary': dark ? v('btn-primary-bg') : mix(WHITE, mark, .4), 'md3-surface-tint': v('accent-text'),
    'md3-inverse-surface': dark ? WHITE : colour(0, 0, 18), 'md3-inverse-on-surface': dark ? BLACK : WHITE,
    'border-subtle': h('hsl-border'), 'border-default': h('hsl-border'), 'border-hover': alpha(primary, .28),
    'bg-hover': `color-mix(in srgb, var(--accent-text) ${dark ? 7 : 5}%, transparent)`,
    'bg-selection': `color-mix(in srgb, var(--btn-primary-bg) ${dark ? 28 : 16}%, transparent)`,
    'accent-surface-soft': `color-mix(in srgb, var(--accent-text) ${dark ? 7 : 5}%, transparent)`,
    'accent-surface-strong': `color-mix(in srgb, var(--btn-primary-bg) ${dark ? 30 : 13}%, transparent)`,
    'border-accent': `color-mix(in srgb, var(--brand-cool) ${dark ? 35 : 20}%, transparent)`,
    'border-accent-hover': `color-mix(in srgb, var(--brand-cool) ${dark ? 50 : 36}%, transparent)`,
    'accent-gradient-strong': 'linear-gradient(135deg, var(--btn-primary-bg), var(--brand-primary))',
    'on-media': WHITE, 'surface-neutral-text': v('text-muted'), 'surface-neutral-bg': v('depth-3'), 'surface-neutral-border': v('border-subtle'),
  }
  for (const suffix of ['card', 'popover', 'secondary', 'accent']) out[`hsl-${suffix}-foreground`] = v('hsl-foreground')
  for (const [i, role] of ['md3-surface', 'md3-surface-container', 'md3-surface-container-high', 'md3-surface-container-highest'].entries()) out[`depth-${i + 1}`] = v(role)
  for (const [token, role] of Object.entries({ root: 'depth-1', dark: 'depth-1', section: 'depth-1', card: 'depth-2', elevated: 'depth-4' })) out[`bg-${token}`] = v(role)
  out['bg-input'] = h('hsl-input')
  for (const [tone, statusHue] of Object.entries(STATUS)) {
    const ink = hueInk(statusHue, tone === 'danger' ? 75 : 65, planes, 5.2, dark)
    const wash = dark ? solve((L) => colour(statusHue, 22, L), (c) => luminance(c) > luminance(card) && contrast(c, card) >= 1.32) : mix(ink, WHITE, .06)
    const channel = tone === 'danger' ? 'destructive' : tone
    out[`hsl-${channel}`] = hsl(ink)
    out[`surface-${tone}-text`] = h(`hsl-${channel}`)
    out[`surface-${tone}-bg`] = wash
    out[`surface-${tone}-border`] = mix(ink, wash, .3)
  }
  out['hsl-destructive-foreground'] = dark ? '0 0% 0%' : '0 0% 100%'
  // The run mix is ordered by luminance so a six-pixel bar stays countable in
  // greyscale. Target ratios, unlike equal L steps, guarantee that separation.
  const track = luminance(raised)
  const first = dark ? (track + .05) * 3.05 - .05 : (track + .05) / 3.05 - .05
  for (const [i, [role, h]] of Object.entries({ cancelled: 230, 'in-flight': 201, failed: 0, waiting: 38, succeeded: 155 }).entries()) {
    const target = dark ? (first + .05) * 1.22 ** i - .05 : (first + .05) / 1.22 ** (4 - i) - .05
    out[`run-mix-${role}`] = solve((L) => colour(h, role === 'cancelled' ? 12 : 60, L), (c) => luminance(c) >= target)
  }
  if (!['dark', 'light'].includes(name)) {
    Object.assign(out, { 'hsl-raised': v('hsl-secondary'), 'hsl-raised-2': v('hsl-popover'),
      'well-page': dark ? backdrop : WHITE, 'well-card': dark ? backdrop : page,
      'well-raised': dark ? card : WHITE, 'well-raised-2': dark ? card : page })
  }
  if (name.startsWith('hospitality')) {
    out['hsl-raised'] = v('hsl-secondary')
    out['hsl-raised-2'] = hsl(plane(dark ? 43.9 : 100))
    out['well-page'] = dark ? backdrop : WHITE
    out['well-card'] = dark ? backdrop : plane(94.9)
    out['well-raised'] = dark ? plane(22.1) : WHITE
    out['well-raised-2'] = dark ? plane(22.1) : plane(94.9)
    out['field-border'] = plane(dark ? 68.3 : 60)
    out['border-strong'] = v('field-border')
    out['text-dim'] = v('text-muted')
    for (const [tone, statusHue] of Object.entries({ ...STATUS, neutral: 140 })) {
      if (tone === 'info') continue
      const wash = lch(dark ? 37.7 : 92, tone === 'neutral' ? .01 : .04, tone === 'danger' ? 25 : statusHue === 38 ? 80 : statusHue)
      out[`surface-${tone}-bg`] = wash
      out[`surface-${tone}-text`] = hueInk(statusHue, tone === 'neutral' ? 4 : 60, [wash], 5.1, dark)
      out[`surface-${tone}-border`] = mix(out[`surface-${tone}-text`], wash, .3)
    }
  }
  for (const [i, tier] of ['c', 'b', 'a', 's'].entries()) out[`chart-tier-${tier}`] = colour(accentHue, 55, dark ? 42 + i * 13 : 76 - i * 15)
  CACHE.set(name, out)
  return out
}

export function renderPalette(template, name) {
  const roles = palette(name)
  return template.replace(/@palette-([a-z][a-z0-9-]*)@/g, (_, role) => {
    if (!(role in roles)) throw new Error(`${name}: unknown palette role ${role}`)
    const value = roles[role]
    return value.startsWith('#') && !/^(well-|field-border|surface-)/.test(role) ? `hsl(${hsl(value)})` : value
  }).replace(/(--(?!tone-)[a-z0-9-]+: )([\d.]+ [\d.]+% [\d.]+%);/g, (_, key, value) => `${key}${value}; /* ${hslHex(...value.split(' ').map(parseFloat))} */`)
}

export function tone(name, mode) {
  const hue = CATEGORY[name], dark = mode === 'dark', p = palette(mode)
  const card = hslHex(...p['hsl-card'].split(' ').map(parseFloat))
  const page = hslHex(...p['hsl-background'].split(' ').map(parseFloat))
  const muted = hslHex(...p['hsl-secondary'].split(' ').map(parseFloat))
  const sat = name === 'brown' ? 36 : name === 'lime' ? 60 : 80
  const fill = solve((L) => colour(hue, sat, L), (c) => contrast(WHITE, mix(WHITE, c, .1)) >= 4.7, true)
  const fills = dark
    ? [1.32, 1.47, 1.62].map((target) => solve((L) => colour(hue, 32, L), (c) => luminance(c) > luminance(card) && contrast(c, card) >= target))
    : [.065, .12, .18].map((t) => mix(fill, WHITE, t))
  const text = hueInk(hue, sat, fills, 4.65, dark)
  const icon = hueInk(hue, sat, fills, 3.15, dark)
  const tints = [page, card, muted].flatMap((p) => [.1, .15, .2].map((t) => mix(fill, p, t)))
  const ink = hueInk(hue, sat, [page, card, ...fills, ...tints], 4.65, dark)
  const ring = dark ? ink : fill
  return { bg: fills[0], 'bg-hover': fills[1], 'bg-selected': fills[2], border: mix(icon, fills[0], .5), 'border-selected': icon, text, icon,
    fill: hsl(fill), ring: hsl(ring), mark: colour(hue, sat, 55), line: icon, ink }
}

export function renderTemplates(source) {
  const [tokens, named] = source.split('/* named-themes.css */')
  if (!named) throw new Error('Palette template has no named-theme section')
  return [tokens, named].map((css, file) => css.replace(/([^{}]*)\{([^{}]*)\}/g, (_, selector, body) => {
    if (!body.includes('@palette-')) return `${selector}{${body}}`
    const theme = selector.match(/data-theme="([a-z-]+)"/)
    let name = file && theme ? theme[1] : /\.light\s*$|data-theme\$="-light"/.test(selector) ? 'light' : 'dark'
    if (['hospitality', 'website'].includes(name) && !selector.includes('.dark[')) name += '-light'
    if (file && !body.includes('--hsl-background:')) name = 'light'
    return `${selector}{${renderPalette(body, name)}}`
  }).trim() + '\n')
}
