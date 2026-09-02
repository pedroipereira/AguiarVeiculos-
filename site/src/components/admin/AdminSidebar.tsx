'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { ComponentType, SVGProps } from 'react'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { LeadQuickAddModal } from './LeadQuickAddModal'
import {
  PainelIcon,
  EstoqueIcon,
  LeadsIcon,
  AgendaIcon,
  MetasIcon,
  RelatoriosIcon,
  SiteIcon,
} from './icons'

interface NavItem {
  label: string
  href?: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Painel', href: '/admin', Icon: PainelIcon },
  { label: 'Estoque', href: '/admin/veiculos', Icon: EstoqueIcon },
  { label: 'Leads', href: '/admin/leads', Icon: LeadsIcon },
  { label: 'Agenda', Icon: AgendaIcon },
  { label: 'Metas', Icon: MetasIcon },
  { label: 'Relatórios', Icon: RelatoriosIcon },
  { label: 'Site', href: '/admin/imagens', Icon: SiteIcon },
]

interface AdminSidebarProps {
  vehicles: VehicleOption[]
}

export function AdminSidebar({ vehicles }: AdminSidebarProps) {
  const pathname = usePathname()
  const [showLeadModal, setShowLeadModal] = useState(false)

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-support-gray/15 bg-white p-4">
      <Link href="/admin/veiculos" className="flex items-center gap-2 px-2 py-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-av.png" alt="Aguiar Veículos" className="h-8 w-8 object-contain" />
        <span className="text-sm font-bold uppercase tracking-wide text-graphite">Aguiar Veículos</span>
      </Link>

      <button
        type="button"
        onClick={() => setShowLeadModal(true)}
        className="rounded-lg bg-aguiar-red px-4 py-2.5 text-center font-bold text-white transition-colors hover:bg-red-700"
      >
        + Novo cliente
      </button>

      {showLeadModal && <LeadQuickAddModal vehicles={vehicles} onClose={() => setShowLeadModal(false)} />}

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, Icon }) => {
          if (!href) {
            return (
              <span
                key={label}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-support-gray/50"
              >
                <Icon />
                {label}
                <span className="ml-auto rounded-full bg-support-gray/10 px-2 py-0.5 text-[10px] font-bold uppercase text-support-gray">
                  Em breve
                </span>
              </span>
            )
          }
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`))
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                active ? 'bg-aguiar-red/10 text-aguiar-red' : 'text-graphite hover:bg-support-gray/10'
              }`}
            >
              <Icon />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
