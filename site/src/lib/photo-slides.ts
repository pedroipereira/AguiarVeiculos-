import { focalOffset, parsePhotoName, PORTRAIT_RATIO } from './focal-point'

/** One photo of the gallery: its landscape file and/or its portrait (3:4) version. */
export interface Slide {
  landscape?: string
  portrait?: string
}

/**
 * Pairs each landscape photo with the portrait version that shares its name (see `parsePhotoName`).
 * The order is the upload order of the landscape photos. A portrait photo with no landscape twin is
 * kept as its own slide, so nothing that was uploaded goes missing.
 */
export function buildSlides(photos: string[]): Slide[] {
  const names = photos.map((src) => ({ src, ...parsePhotoName(src) }))
  const slides: Slide[] = []
  const byKey = new Map<string, Slide>()
  for (const photo of names) {
    if (photo.vertical) continue
    const slide: Slide = { landscape: photo.src }
    slides.push(slide)
    if (photo.key && !byKey.has(photo.key)) byKey.set(photo.key, slide)
  }
  for (const photo of names) {
    if (!photo.vertical) continue
    const twin = photo.key ? byKey.get(photo.key) : undefined
    if (twin && !twin.portrait) twin.portrait = photo.src
    else slides.push({ portrait: photo.src })
  }
  return slides
}

/**
 * The CSS variables that center each file on its subject: `--focal-l` for the landscape file and
 * `--focal-p` for the portrait one. The image picks one with the orientation of the screen.
 */
export function slideFocusVars(slide: Slide): Record<string, string> {
  const vars: Record<string, string> = {}
  const landscape = slide.landscape ? focalOffset(parsePhotoName(slide.landscape).focalX) : undefined
  const portrait = slide.portrait ? focalOffset(parsePhotoName(slide.portrait).focalX, PORTRAIT_RATIO) : undefined
  if (landscape) vars['--focal-l'] = landscape
  if (slide.portrait) vars['--focal-p'] = portrait ?? 'center'
  // Only a portrait photo: it is the one shown on every screen, so it sets the landscape variable too.
  if (!slide.landscape && slide.portrait) vars['--focal-l'] = portrait ?? 'center'
  return vars
}
