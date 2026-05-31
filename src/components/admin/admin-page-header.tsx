import type { ReactNode } from 'react'

type AdminPageHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
      <div>
        <h2 className='text-xl font-semibold tracking-tight'>{title}</h2>
        {description && <p className='text-sm text-muted-foreground mt-1'>{description}</p>}
      </div>
      {action && <div className='flex shrink-0 items-center gap-2'>{action}</div>}
    </div>
  )
}
