import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminDataTableProps = {
  children: ReactNode
  className?: string
}

export function AdminDataTable({ children, className }: AdminDataTableProps) {
  return (
    <div className={cn('rounded-md border overflow-x-auto', className)}>
      <table className='w-full caption-bottom text-sm'>{children}</table>
    </div>
  )
}

export function AdminDataTableHeader({ children }: { children: ReactNode }) {
  return <thead className='border-b bg-muted/50'>{children}</thead>
}

export function AdminDataTableBody({ children }: { children: ReactNode }) {
  return <tbody className='[&_tr:last-child]:border-0'>{children}</tbody>
}

export function AdminDataTableRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <tr className={cn('border-b transition-colors hover:bg-muted/30', className)}>{children}</tr>
  )
}

export function AdminDataTableHead({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function AdminDataTableCell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <td className={cn('px-4 py-3 align-middle', className)}>{children}</td>
}
