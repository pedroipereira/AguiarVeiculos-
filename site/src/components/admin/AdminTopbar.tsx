import { LogoutButton } from './LogoutButton'

interface AdminTopbarProps {
  userEmail: string | null
}

export function AdminTopbar({ userEmail }: AdminTopbarProps) {
  const initials = (userEmail ?? 'Administrador').slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center gap-4 border-b border-support-gray/15 bg-white px-6 py-3">
      <div className="ml-auto flex items-center gap-4">
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
