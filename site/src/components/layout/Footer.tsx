import Link from 'next/link'
import { SOCIAL_LINKS } from '@/lib/social-links'

const MAP_EMBED = 'https://www.google.com/maps?q=Aguiar+Ve%C3%ADculos,+Presidente+Dutra+-+MA&output=embed'

const NAV_LINKS = [
  { href: '/', label: 'Página Inicial' },
  { href: '/estoque', label: 'Nossos Veículos' },
  { href: '/financiamento', label: 'Financiamento e avaliação' },
  { href: '/#quinze-anos', label: 'Empresa' },
  { href: '/#contato', label: 'Contato' },
  { href: '/#como-chegar', label: 'Como chegar' },
]

export function Footer() {
  const textLinks = SOCIAL_LINKS.filter((item) => item.showAsTextLink)

  return (
    <footer id="contato" className="border-t border-white/10 bg-graphite px-6 py-14 text-white/85">
      <div data-testid="footer-panel" className="mx-auto max-w-[1156px] rounded-3xl border border-white/15 p-8 md:p-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="flex flex-col items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logos/logo-horizontal-transparente.png" alt="Aguiar Veículos" className="h-16 w-auto" />
            <p className="max-w-xs text-base tracking-wide">Realizando sonhos sobre quatro rodas.</p>
            <div className="mt-3 min-h-40 w-full max-w-xs flex-1 overflow-hidden rounded-xl border border-white/15">
              <iframe title="Mapa até a Aguiar Veículos" src={MAP_EMBED} loading="lazy" className="h-full min-h-40 w-full" />
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/85">Navegação</p>
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
              <p className="text-xs font-bold uppercase tracking-widest text-white/85">Contato</p>
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
              <a href="tel:+5598991030107" className="text-white transition-colors hover:text-aguiar-red">
                Telefone
              </a>
              <a
                href="mailto:aguiarveiculospdutra@hotmail.com"
                className="text-white transition-colors hover:text-aguiar-red"
              >
                E-mail
              </a>
              <p>Av. Campo Dantas, 1689 - Presidente Dutra</p>
              <p>
                Segunda a sexta, 7h30 às 17h30
                <br />
                Sábado, 8h às 13h
              </p>
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
      </div>

      <div className="mx-auto mt-8 max-w-[1156px] px-2 text-xs">
        © {new Date().getFullYear()} Aguiar Veículos. Todos os direitos reservados.
      </div>
    </footer>
  )
}
