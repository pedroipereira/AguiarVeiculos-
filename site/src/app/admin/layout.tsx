import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-graphite text-white">
      <nav className="flex gap-6 border-b border-support-gray px-6 py-4">
        <Link href="/admin/veiculos" className="font-bold uppercase hover:text-aguiar-red">Veículos</Link>
        <Link href="/admin/depoimentos" className="font-bold uppercase hover:text-aguiar-red">Depoimentos</Link>
        <Link href="/admin/leads" className="font-bold uppercase hover:text-aguiar-red">Leads</Link>
        <Link href="/admin/configuracoes" className="font-bold uppercase hover:text-aguiar-red">Configurações</Link>
      </nav>
      <div className="px-6 py-8">{children}</div>
    </div>
  )
}
