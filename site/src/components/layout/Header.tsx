'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

const NAV_LINKS = [
  { href: '/', label: 'Página Inicial' },
  { href: '/estoque', label: 'Nossos Veículos' },
  { href: '/financiamento', label: 'Simule' },
  { href: '/#quinze-anos', label: 'Empresa' },
  { href: '/#contato', label: 'Contato' },
  { href: '/#como-chegar', label: 'Como chegar' },
]

export function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!isHome) {
      setScrolled(true)
      return
    }
    function handleScroll() {
      setScrolled(window.scrollY > 40)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const transparent = isHome && !scrolled && !menuOpen

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-3">
      <div
        data-testid="header-bar"
        className={`pointer-events-auto mx-auto max-w-[1156px] rounded-2xl border px-4 py-2 transition-colors duration-300 ${
          transparent
            ? 'border-transparent bg-transparent'
            : 'border-white/10 bg-graphite/60 shadow-lg backdrop-blur-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logos/logo-horizontal-transparente.png"
              alt="Aguiar Veículos"
              width={1750}
              height={765}
              priority
              className="h-12 w-auto"
            />
          </Link>

          <nav className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap py-3 text-sm font-bold text-white underline decoration-transparent decoration-2 underline-offset-4 transition-all hover:decoration-aguiar-red lg:py-0"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 md:block">
            <WhatsAppButton message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
              WhatsApp
            </WhatsAppButton>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span
              className={`h-0.5 w-6 bg-white transition-transform ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
            />
            <span className={`h-0.5 w-6 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span
              className={`h-0.5 w-6 bg-white transition-transform ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
            />
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="mt-2 flex flex-col gap-2 pb-4 md:hidden">
            <nav className="flex flex-col items-center pt-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-3 text-sm font-bold text-white underline decoration-transparent decoration-2 underline-offset-4 transition-all hover:decoration-aguiar-red"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex justify-center pt-2">
              <WhatsAppButton message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
                WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
