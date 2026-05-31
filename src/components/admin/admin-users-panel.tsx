'use client'

import { useEffect, useState } from 'react'
import { UserRole } from '@prisma/client'
import { MoreHorizontal, Users } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useToast } from '@/hooks/use-toast'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminPageHeader } from './admin-page-header'
import { AdminToolbar } from './admin-toolbar'
import { AdminEmptyState } from './admin-empty-state'
import { AdminConfirmDialog } from './admin-confirm-dialog'
import {
  AdminDataTable,
  AdminDataTableBody,
  AdminDataTableCell,
  AdminDataTableHead,
  AdminDataTableHeader,
  AdminDataTableRow,
} from './admin-data-table'
import { BanUserDialog } from './ban-user-dialog'

const roles: UserRole[] = ['ADMIN', 'ORGANIZER', 'PLAYER', 'SPECTATOR']

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Admin',
  ORGANIZER: 'Organizer',
  PLAYER: 'Player',
  SPECTATOR: 'Spectator',
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminUsersPanel() {
  const utils = trpc.useUtils()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [bannedOnly, setBannedOnly] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>()
  const [banTarget, setBanTarget] = useState<{ id: string; email: string } | null>(null)
  const [roleChange, setRoleChange] = useState<{ userId: string; email: string; role: UserRole } | null>(
    null,
  )
  const [restoreTarget, setRestoreTarget] = useState<{ id: string; email: string } | null>(null)
  const [users, setUsers] = useState<
    Array<{
      id: string
      email: string
      name: string | null
      username: string | null
      role: UserRole
      bannedAt: Date | null
      banReason: string | null
      createdAt: Date
      bannedBy: { id: string; email: string } | null
    }>
  >([])

  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    setCursor(undefined)
    setUsers([])
  }, [debouncedSearch, roleFilter, bannedOnly])

  const { data, isLoading, isFetching } = trpc.admin.listUsers.useQuery({
    search: debouncedSearch || undefined,
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    bannedOnly,
    limit: 25,
    cursor,
  })

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: (user) => {
      void utils.admin.listUsers.invalidate()
      void utils.admin.getOverview.invalidate()
      setRoleChange(null)
      toast({
        title: 'Role updated',
        description: `${user.email} is now ${roleLabels[user.role]}.`,
      })
    },
    onError: (error) => {
      toast({ title: 'Could not update role', description: error.message, variant: 'destructive' })
    },
  })

  const banUser = trpc.admin.banUser.useMutation({
    onSuccess: (user) => {
      void utils.admin.listUsers.invalidate()
      void utils.admin.getOverview.invalidate()
      setBanTarget(null)
      toast({ title: 'Account suspended', description: user.email })
    },
    onError: (error) => {
      toast({ title: 'Could not suspend account', description: error.message, variant: 'destructive' })
    },
  })

  const unbanUser = trpc.admin.unbanUser.useMutation({
    onSuccess: (user) => {
      void utils.admin.listUsers.invalidate()
      void utils.admin.getOverview.invalidate()
      setRestoreTarget(null)
      toast({ title: 'Access restored', description: user.email })
    },
    onError: (error) => {
      toast({ title: 'Could not restore access', description: error.message, variant: 'destructive' })
    },
  })

  useEffect(() => {
    if (!data?.users) return
    setUsers((prev) => (cursor ? [...prev, ...data.users] : data.users))
  }, [data?.users, cursor])

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        title='Users'
        description='Manage roles and account access across the platform.'
      />

      <AdminToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setCursor(undefined)
        }}
        searchPlaceholder='Search email, name, or username…'
        filters={
          <>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value as UserRole | 'ALL')
                setCursor(undefined)
              }}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='All roles' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabels[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={bannedOnly ? 'default' : 'outline'}
              size='sm'
              onClick={() => {
                setBannedOnly((v) => !v)
                setCursor(undefined)
              }}
            >
              {bannedOnly ? 'Suspended only' : 'All users'}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <Skeleton className='h-64 w-full' />
      ) : users.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title='No users found'
          description={
            bannedOnly
              ? 'No suspended accounts match your filters.'
              : 'Try adjusting search or role filters.'
          }
        />
      ) : (
        <>
          <AdminDataTable>
            <AdminDataTableHeader>
              <AdminDataTableRow>
                <AdminDataTableHead>Email</AdminDataTableHead>
                <AdminDataTableHead>Profile</AdminDataTableHead>
                <AdminDataTableHead>Role</AdminDataTableHead>
                <AdminDataTableHead>Status</AdminDataTableHead>
                <AdminDataTableHead>Joined</AdminDataTableHead>
                <AdminDataTableHead className='w-[60px]' />
              </AdminDataTableRow>
            </AdminDataTableHeader>
            <AdminDataTableBody>
              {users.map((user) => (
                <AdminDataTableRow key={user.id}>
                  <AdminDataTableCell className='font-medium'>{user.email}</AdminDataTableCell>
                  <AdminDataTableCell className='text-muted-foreground'>
                    {[user.name, user.username].filter(Boolean).join(' · ') || '—'}
                  </AdminDataTableCell>
                  <AdminDataTableCell>
                    <Badge variant='outline'>{roleLabels[user.role]}</Badge>
                  </AdminDataTableCell>
                  <AdminDataTableCell>
                    {user.bannedAt ? (
                      <div className='space-y-0.5'>
                        <Badge variant='destructive'>Suspended</Badge>
                        {user.bannedBy && (
                          <p className='text-xs text-muted-foreground'>
                            by {user.bannedBy.email}
                          </p>
                        )}
                        {user.banReason && (
                          <p className='text-xs text-muted-foreground truncate max-w-[200px]'>
                            {user.banReason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant='secondary'>Active</Badge>
                    )}
                  </AdminDataTableCell>
                  <AdminDataTableCell className='text-muted-foreground whitespace-nowrap'>
                    {formatDate(user.createdAt)}
                  </AdminDataTableCell>
                  <AdminDataTableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8'>
                          <MoreHorizontal className='h-4 w-4' />
                          <span className='sr-only'>Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {!user.bannedAt && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Change role</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {roles
                                .filter((r) => r !== user.role)
                                .map((r) => (
                                  <DropdownMenuItem
                                    key={r}
                                    onClick={() =>
                                      setRoleChange({ userId: user.id, email: user.email, role: r })
                                    }
                                  >
                                    Make {roleLabels[r]}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        <DropdownMenuSeparator />
                        {user.bannedAt ? (
                          <DropdownMenuItem
                            onClick={() => setRestoreTarget({ id: user.id, email: user.email })}
                          >
                            Restore access
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive'
                            onClick={() => setBanTarget({ id: user.id, email: user.email })}
                          >
                            Suspend account
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {roleChange && (
        <AdminConfirmDialog
          open={!!roleChange}
          onOpenChange={(open) => !open && setRoleChange(null)}
          title='Change user role'
          description={`Make ${roleChange.email} a ${roleLabels[roleChange.role]}? They will get access based on that role immediately.`}
          confirmLabel='Change role'
          isPending={updateRole.isPending}
          onConfirm={() =>
            updateRole.mutate({ userId: roleChange.userId, role: roleChange.role })
          }
        />
      )}

      {restoreTarget && (
        <AdminConfirmDialog
          open={!!restoreTarget}
          onOpenChange={(open) => !open && setRestoreTarget(null)}
          title='Restore access'
          description={`Allow ${restoreTarget.email} to sign in again?`}
          confirmLabel='Restore access'
          isPending={unbanUser.isPending}
          onConfirm={() => unbanUser.mutate({ userId: restoreTarget.id })}
        />
      )}

      {banTarget && (
        <BanUserDialog
          open={!!banTarget}
          onOpenChange={(open) => !open && setBanTarget(null)}
          userEmail={banTarget.email}
          isPending={banUser.isPending}
          onConfirm={(reason) =>
            banUser.mutate({ userId: banTarget.id, reason: reason || undefined })
          }
        />
      )}
    </div>
  )
}
