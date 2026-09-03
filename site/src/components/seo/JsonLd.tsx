/** Renders a schema.org JSON-LD block. Escapes `<` so the payload can never
 *  break out of the surrounding <script> tag, even with untrusted-ish string
 *  fields (a vehicle's free-text description, etc). */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
