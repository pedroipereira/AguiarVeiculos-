import type { Lead } from '@/lib/types'

const TYPE_LABEL: Record<Lead['type'], string> = {
  financing: 'Financiamento',
  trade_in: 'Avaliação de usado',
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-support-gray">
          <th className="py-2">Nome</th>
          <th>Telefone</th>
          <th>Tipo</th>
          <th>Detalhes</th>
          <th>Recebido em</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => (
          <tr key={lead.id} className="border-b border-support-gray/40">
            <td className="py-2">{lead.name}</td>
            <td>{lead.phone}</td>
            <td>{TYPE_LABEL[lead.type]}</td>
            <td>{lead.details ? JSON.stringify(lead.details) : '—'}</td>
            <td>{new Date(lead.created_at).toLocaleString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
