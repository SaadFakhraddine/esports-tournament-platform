'use client'

import { useEffect, useState } from 'react'
import { AdminAuditAction } from '@prisma/client'
import { ClipboardList } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminPageHeader } from './admin-page-header'
import { AdminToolbar } from './admin-toolbar'
import { AdminEmptyState } from './admin-empty-state'
import {
  AdminDataTable,
  AdminDataTableBody,
  AdminDataTableCell,
  AdminDataTableHead,
  AdminDataTableHeader,
  AdminDataTableRow,
} from './admin-data-table'
import { formatAuditAction, formatAuditDetails } from '@/lib/admin/audit-labels'

const allActions: AdminAuditAction[] = [
  'USER_ROLE_CHANGED',
  'USER_BANNED',
  'USER_UNBANNED',
  'GAME_CREATED',
  'GAME_UPDATED',
  'GAME_DELETED',
]

type AuditEntry = {
  id: string
  action: AdminAuditAction
  targetType: string
  targetId: string
  metadata: unknown
  createdAt: Date
  actor: { email: string }
}

function formatTimestamp(date: Date | string): string {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function actionBadgeVariant(
  action: AdminAuditAction,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action === 'USER_BANNED' || action === 'GAME_DELETED') return 'destructive'
  if (action === 'USER_UNBANNED' || action === 'GAME_CREATED') return 'default'
  return 'secondary'
}

export function AdminAuditPanel() {
  const [actionFilter, setActionFilter] = useState<AdminAuditAction | 'ALL'>('ALL')
  const [cursor, setCursor] = useState<string | undefined>()
  const [entries, setEntries] = useState<AuditEntry[]>([])

  useEffect(() => {
    setCursor(undefined)
    setEntries([])
  }, [actionFilter])

  const { data, isLoading, isFetching } = trpc.admin.listAuditLog.useQuery({
    action: actionFilter === 'ALL' ? undefined : actionFilter,
    limit: 50,
    cursor,
  })

  useEffect(() => {
    if (!data?.entries) return
    setEntries((prev) => (cursor ? [...prev, ...(data.entries as AuditEntry[])] : (data.entries as AuditEntry[])))
  }, [data?.entries, cursor])

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        title='Audit log'
        description='Record of admin actions on users and games.'
      />

      <AdminToolbar
        filters={
          <Select
            value={actionFilter}
            onValueChange={(value) => setActionFilter(value as AdminAuditAction | 'ALL')}
          >
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='All actions' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All actions</SelectItem>
              {allActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {formatAuditAction(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <Skeleton className='h-64 w-full' />
      ) : entries.length === 0 ? (
        <AdminEmptyState
          icon={ClipboardList}
          title='No admin actions yet'
          description='Actions such as role changes, suspensions, and game edits will appear here.'
        />
      ) : (
        <>
          <AdminDataTable>
            <AdminDataTableHeader>
              <AdminDataTableRow>
                <AdminDataTableHead>When</AdminDataTableHead>
                <AdminDataTableHead>Actor</AdminDataTableHead>
                <AdminDataTableHead>Action</AdminDataTableHead>
                <AdminDataTableHead>Details</AdminDataTableHead>
              </AdminDataTableRow>
            </AdminDataTableHeader>
            <AdminDataTableBody>
              {entries.map((entry) => (
                <AdminDataTableRow key={entry.id}>
                  <AdminDataTableCell className='text-muted-foreground whitespace-nowrap'>
                    {formatTimestamp(entry.createdAt)}
                  </AdminDataTableCell>
                  <AdminDataTableCell>{entry.actor.email}</AdminDataTableCell>
                  <AdminDataTableCell>
                    <Badge variant={actionBadgeVariant(entry.action)}>
                      {formatAuditAction(entry.action)}
                    </Badge>
                  </AdminDataTableCell>
                  <AdminDataTableCell className='max-w-md truncate'>
                    {formatAuditDetails(
                      entry.action,
                      entry.metadata as Record<string, unknown> | null,
                    )}
                  </AdminDataTableCell>
                </AdminDataTableRow>
              ))}
            </AdminDataTableBody>
          </AdminDataTable>

          {data?.nextCursor && (
            <div className='flex justify-center'>
              <Button
                variant='outline'
                disabled={isFetching}
                onClick={() => setCursor(data.nextCursor)}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
