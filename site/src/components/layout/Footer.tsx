import Link from 'next/link'
import { SOCIAL_LINKS } from '@/lib/social-links'

const NAV_LINKS = [
  { href: '/', label: 'Página Inicial' },
  { href: '/estoque', label: 'Nossos Veículos' },
  { href: '/financiamento', label: 'Financiamento e avaliação' },
  { href: '/#diferenciais', label: 'Diferenciais' },
  { href: '/#quinze-anos', label: 'Empresa' },
  { href: '/#contato', label: 'Contato' },
]

export function Footer() {
  const textLinks = SOCIAL_LINKS.filter((item) => item.showAsTextLink)

  return (
    <footer className="border-t border-white/10 bg-graphite px-6 py-14 text-support-gray">
      <div className="mx-auto grid max-w-[1156px] grid-cols-1 gap-12 md:grid-cols-3">
        <div className="flex flex-col items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-full.png" alt="Aguiar Veículos" className="h-16 w-auto" />
          <p className="max-w-xs text-base tracking-wide">Procedência, confiança e compromisso em cada venda.</p>
        </div>

        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-widest text-support-gray">Navegação</p>
          </div>
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base tracking-wide text-white transition-colors hover:text-aguiar-red"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-widest text-support-gray">Contato</p>
          </div>
          <div className="flex flex-col gap-3 text-base tracking-wide">
            {textLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white transition-colors hover:text-aguiar-red"
              >
                {item.label}
              </a>
            ))}
            <p>Av. Campo Dantas, 1689 - Presidente Dutra</p>
            <p>Segunda a sexta, 7h30 às 17h30</p>
          </div>
          <div className="mt-5 flex gap-3">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white/20 transition-colors hover:border-aguiar-red"
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1156px] border-t border-white/10 pt-6 text-xs">
        © {new Date().getFullYear()} Aguiar Veículos. Todos os direitos reservados.
      </div>
    </footer>
  )
}
