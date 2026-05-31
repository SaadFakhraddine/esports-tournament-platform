import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

type AdminToolbarProps = {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  actions?: ReactNode
}

export function AdminToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  actions,
}: AdminToolbarProps) {
  return (
    <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
      <div className='flex flex-1 flex-col gap-3 sm:flex-row sm:items-center'>
        {onSearchChange !== undefined && (
          <div className='relative w-full sm:max-w-sm'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              placeholder={searchPlaceholder}
              className='pl-10'
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {filters && <div className='flex flex-wrap items-center gap-2'>{filters}</div>}
      </div>
      {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
    </div>
  )
}
