import { LogoutButton } from './LogoutButton'
import { SearchIcon, BellIcon } from './icons'

interface AdminTopbarProps {
  userEmail: string | null
}

export function AdminTopbar({ userEmail }: AdminTopbarProps) {
  const initials = (userEmail ?? 'Administrador').slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center gap-4 border-b border-support-gray/15 bg-white px-6 py-3">
      <div className="relative w-full max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-support-gray" />
        <input
          type="search"
          placeholder="Buscar..."
          aria-label="Buscar"
          className="w-full rounded-lg border border-support-gray/25 py-2 pl-10 pr-3 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          aria-label="Notificações"
          className="rounded-full p-2 text-support-gray transition-colors hover:bg-support-gray/10"
        >
          <BellIcon />
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-graphite text-sm font-bold text-white">
            {initials}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-graphite">{userEmail ?? 'Administrador'}</span>
            <span className="text-xs text-support-gray">Administrador</span>
          </div>
        </div>

        <LogoutButton />
      </div>
    </header>
  )
}
