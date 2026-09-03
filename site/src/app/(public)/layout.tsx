import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBusinessJsonLd } from '@/lib/seo'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={buildBusinessJsonLd()} />
      <Header />
      {children}
      <Footer />
      <FloatingWhatsApp />
    </>
  )
}
