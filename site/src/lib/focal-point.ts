// The site photos are 16:9. The panel keeps the file name when a photo is uploaded, so the point of
// the photo that must stay in view (in % of its width) is written at the end of the name:
// `galeria-05-recepcao-x63.jpg` keeps the subject at 63% of the width. No number means the middle.
const PHOTO_RATIO = 16 / 9

export function parseFocalX(src?: string): number | undefined {
  const match = src?.split('?')[0].match(/-x(\d{1,3})\.[a-z0-9]+$/i)
  if (!match) return undefined
  const x = Number(match[1])
  return x <= 100 ? x : undefined
}

/**
 * The `object-position` (horizontal part) that puts the focus in the middle of the box. A plain
 * percentage does not do it: it depends on how much of the photo is hidden. The box must be a size
 * container (`container-type: size`) so `cqw`/`cqh` are its width and height. The offset never goes
 * past the photo edges.
 */
export function focalOffset(x?: number): string | undefined {
  if (x == null) return undefined
  const scaledWidth = `max(100cqw, ${(PHOTO_RATIO * 100).toFixed(4)}cqh)`
  return `clamp(calc(100cqw - ${scaledWidth}), calc(50cqw - ${x / 100} * ${scaledWidth}), 0px)`
}
