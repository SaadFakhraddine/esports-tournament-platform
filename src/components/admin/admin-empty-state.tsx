import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type AdminEmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function AdminEmptyState({ icon: Icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-12 px-6 text-center'>
      <Icon className='h-10 w-10 text-muted-foreground/60 mb-3' />
      <p className='font-medium'>{title}</p>
      {description && (
        <p className='text-sm text-muted-foreground mt-1 max-w-sm'>{description}</p>
      )}
      {action && <div className='mt-4'>{action}</div>}
    </div>
  )
}
