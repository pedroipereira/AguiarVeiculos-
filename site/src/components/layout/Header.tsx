import Link from 'next/link'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

export function Header() {
  return (
    <header className="flex items-center justify-between bg-graphite px-6 py-4">
      <Link href="/" className="text-xl font-bold uppercase tracking-wide text-white">
        Aguiar <span className="text-aguiar-red">Veículos</span>
      </Link>
      <nav className="flex items-center gap-6">
        <Link href="/estoque" className="font-bold uppercase text-white hover:text-aguiar-red">
          Ver estoque
        </Link>
        <WhatsAppButton message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
          WhatsApp
        </WhatsAppButton>
      </nav>
    </header>
  )
}
