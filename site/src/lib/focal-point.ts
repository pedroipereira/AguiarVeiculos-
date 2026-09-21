// The panel keeps the file name when a photo is uploaded, so the point of the photo that must stay in
// view (in % of its width) is written at the end of the name: `galeria-05-recepcao-x63.jpg` keeps the
// subject at 63% of the width. No number means the middle.
// A portrait (3:4) version of the same photo carries `-vertical` before the number:
// `galeria-05-recepcao-vertical-x55.jpg`. Both share the name before it, which is how they are paired.
const PHOTO_RATIO = 16 / 9
export const PORTRAIT_RATIO = 3 / 4
const UPLOAD_CODE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i

export function parseFocalX(src?: string): number | undefined {
  const match = src?.split('?')[0].match(/-x(\d{1,3})\.[a-z0-9]+$/i)
  if (!match) return undefined
  const x = Number(match[1])
  return x <= 100 ? x : undefined
}

export interface PhotoName {
  /** The name shared by the landscape and portrait versions of a photo. */
  key: string
  vertical: boolean
  focalX?: number
}

/** `<upload code>-galeria-01-rua-vertical-x33.jpg` gives `{ key: 'galeria-01-rua', vertical: true, focalX: 33 }`. */
export function parsePhotoName(src: string): PhotoName {
  const last = src.split('?')[0].split('/').pop() ?? ''
  let file = last
  try {
    file = decodeURIComponent(last)
  } catch {
    // A stray "%" in the name: keep it as it came.
  }
  let name = file.replace(/\.[a-z0-9]+$/i, '').replace(UPLOAD_CODE, '').replace(/-+$/, '')
  // "(vertical)" typed in a file name comes out of the upload as "-vertical-", in any position.
  const vertical = /-vertical(?=-|$)/i.test(name)
  name = name.replace(/-vertical(?=-|$)/i, '')
  const match = name.match(/-x(\d{1,3})$/i)
  const x = match ? Number(match[1]) : undefined
  if (match) name = name.slice(0, match.index)
  return { key: name, vertical, focalX: x != null && x <= 100 ? x : undefined }
}

/**
 * The `object-position` (horizontal part) that puts the focus in the middle of the box. A plain
 * percentage does not do it: it depends on how much of the photo is hidden. The box must be a size
 * container (`container-type: size`) so `cqw`/`cqh` are its width and height. `ratio` is the width over
 * the height of the photo. The offset never goes past the photo edges.
 */
export function focalOffset(x?: number, ratio: number = PHOTO_RATIO): string | undefined {
  if (x == null) return undefined
  const scaledWidth = `max(100cqw, ${(ratio * 100).toFixed(4)}cqh)`
  return `clamp(calc(100cqw - ${scaledWidth}), calc(50cqw - ${x / 100} * ${scaledWidth}), 0px)`
}
