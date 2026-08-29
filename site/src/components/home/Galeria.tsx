import { Section } from '@/components/ui/Section'

const PHOTOS = ['/images/loja-1.jpg', '/images/loja-2.jpg', '/images/loja-3.jpg', '/images/loja-4.jpg']

export function Galeria() {
  return (
    <Section eyebrow="Conheça a loja" title="Showroom Aguiar Veículos">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {PHOTOS.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="Showroom da Aguiar Veículos" className="aspect-square w-full rounded object-cover" />
        ))}
      </div>
    </Section>
  )
}
