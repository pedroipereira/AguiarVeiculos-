'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

const NAV_LINKS = [
  { href: '/', label: 'Página Inicial' },
  { href: '/estoque', label: 'Nossos Veículos' },
  { href: '/financiamento', label: 'Simule' },
  { href: '/#quinze-anos', label: 'Empresa' },
  { href: '/#diferenciais', label: 'Diferenciais' },
  { href: '/#contato', label: 'Contato' },
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
    <header
      className={`fixed inset-x-0 top-0 z-50 px-4 py-2 transition-colors duration-300 ${
        transparent ? 'bg-transparent' : 'bg-graphite'
      }`}
    >
      <div className="flex items-center justify-between md:justify-center md:gap-x-[85px]">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-full.png" alt="Aguiar Veículos" className="h-12 w-auto" />
        </Link>

        <nav className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-sm font-bold text-white underline decoration-transparent decoration-2 underline-offset-4 transition-all hover:decoration-aguiar-red"
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
          className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1.5 md:hidden"
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
        <div id="mobile-menu" className="mt-2 flex flex-col gap-2 bg-graphite pb-4 md:hidden">
          <nav className="flex flex-col items-center gap-4 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-white underline decoration-transparent decoration-2 underline-offset-4 transition-all hover:decoration-aguiar-red"
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
    </header>
  )
}
