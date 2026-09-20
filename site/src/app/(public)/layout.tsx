import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreventPinchZoom } from '@/components/layout/PreventPinchZoom'
import { buildBusinessJsonLd } from '@/lib/seo'
import { noZoomViewport } from '@/lib/viewport'

export const viewport = noZoomViewport

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-select">
      <JsonLd data={buildBusinessJsonLd()} />
      <PreventPinchZoom />
      <Header />
      {children}
      <Footer />
      <FloatingWhatsApp />
    </div>
  )
}
