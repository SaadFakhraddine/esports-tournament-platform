'use client'

import { useState } from 'react'
import { UserRole } from '@prisma/client'
import { trpc } from '@/lib/trpc/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BanUserDialog } from './ban-user-dialog'

const roles: UserRole[] = ['ADMIN', 'ORGANIZER', 'PLAYER', 'SPECTATOR']

export function AdminUsersPanel() {
  const utils = trpc.useUtils()
  const [search, setSearch] = useState('')
  const [bannedOnly, setBannedOnly] = useState(false)
  const [banTarget, setBanTarget] = useState<{ id: string; email: string } | null>(null)

  const { data, isLoading } = trpc.admin.listUsers.useQuery({
    search: search || undefined,
    bannedOnly,
    limit: 50,
  })

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => void utils.admin.listUsers.invalidate(),
  })
  const banUser = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      void utils.admin.listUsers.invalidate()
      setBanTarget(null)
    },
  })
  const unbanUser = trpc.admin.unbanUser.useMutation({
    onSuccess: () => void utils.admin.listUsers.invalidate(),
  })

  const users = data?.users ?? []

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row'>
        <Input
          placeholder='Search by email, name, or username…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='sm:max-w-md'
        />
        <Button
          variant={bannedOnly ? 'default' : 'outline'}
          onClick={() => setBannedOnly((v) => !v)}
        >
          {bannedOnly ? 'Showing suspended only' : 'Show suspended only'}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className='h-48 w-full' />
      ) : (
        <div className='space-y-3'>
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className='flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <p className='font-medium'>{user.email}</p>
                  <p className='text-sm text-muted-foreground'>
                    {[user.name, user.username].filter(Boolean).join(' · ') || 'No display name'}
                  </p>
                  {user.bannedAt && (
                    <p className='mt-1 text-sm text-destructive'>
                      Suspended {new Date(user.bannedAt).toLocaleDateString()}
                      {user.banReason ? ` — ${user.banReason}` : ''}
                    </p>
                  )}
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  {user.bannedAt ? (
                    <Badge variant='destructive'>Suspended</Badge>
                  ) : (
                    <Badge variant='outline'>{user.role}</Badge>
                  )}
                  <Select
                    value={user.role}
                    onValueChange={(role) =>
                      updateRole.mutate({ userId: user.id, role: role as UserRole })
                    }
                    disabled={!!user.bannedAt || updateRole.isPending}
                  >
                    <SelectTrigger className='w-[140px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user.bannedAt ? (
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={unbanUser.isPending}
                      onClick={() => unbanUser.mutate({ userId: user.id })}
                    >
                      Restore access
                    </Button>
                  ) : (
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => setBanTarget({ id: user.id, email: user.email })}
                    >
                      Suspend
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
