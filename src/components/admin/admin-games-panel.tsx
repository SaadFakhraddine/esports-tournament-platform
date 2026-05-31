'use client'

import { useMemo, useState } from 'react'
import { Gamepad2, Plus, MoreHorizontal } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { AdminGameFormDialog, type GameFormValues } from './admin-game-form-dialog'

type GameRow = {
  id: string
  name: string
  slug: string
  description: string | null
  active: boolean
  _count: { tournaments: number; teams: number }
}

export function AdminGamesPanel() {
  const utils = trpc.useUtils()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editGame, setEditGame] = useState<GameRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GameRow | null>(null)
  const [toggleTarget, setToggleTarget] = useState<{ game: GameRow; active: boolean } | null>(
    null,
  )

  const debouncedSearch = useDebouncedValue(search)
  const { data: games, isLoading } = trpc.admin.listGames.useQuery()

  const createGame = trpc.admin.createGame.useMutation({
    onSuccess: (game) => {
      void utils.admin.listGames.invalidate()
      void utils.admin.getOverview.invalidate()
      setFormOpen(false)
      toast({ title: 'Game added', description: game.name })
    },
    onError: (error) => {
      toast({ title: 'Could not add game', description: error.message, variant: 'destructive' })
    },
  })

  const updateGame = trpc.admin.updateGame.useMutation({
    onSuccess: (game) => {
      void utils.admin.listGames.invalidate()
      void utils.admin.getOverview.invalidate()
      setEditGame(null)
      setToggleTarget(null)
      toast({ title: 'Game updated', description: game.name })
    },
    onError: (error) => {
      toast({ title: 'Could not update game', description: error.message, variant: 'destructive' })
    },
  })

  const deleteGame = trpc.admin.deleteGame.useMutation({
    onSuccess: () => {
      void utils.admin.listGames.invalidate()
      void utils.admin.getOverview.invalidate()
      setDeleteTarget(null)
      toast({ title: 'Game deleted' })
    },
    onError: (error) => {
      toast({ title: 'Could not delete game', description: error.message, variant: 'destructive' })
    },
  })

  const filteredGames = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q || !games) return games ?? []
    return games.filter(
      (g) => g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q),
    )
  }, [games, debouncedSearch])

  const handleCreate = (values: GameFormValues) => {
    createGame.mutate({
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || null,
      active: values.active,
    })
  }

  const handleEdit = (values: GameFormValues) => {
    if (!editGame) return
    updateGame.mutate({
      id: editGame.id,
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || null,
      active: values.active,
    })
  }

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        title='Games'
        description='Manage the game catalog used in tournaments and teams.'
        action={
          <Button className='gap-2' onClick={() => setFormOpen(true)}>
            <Plus className='h-4 w-4' />
            Add game
          </Button>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Search by name or slug…'
      />

      {isLoading ? (
        <Skeleton className='h-64 w-full' />
      ) : filteredGames.length === 0 ? (
        <AdminEmptyState
          icon={Gamepad2}
          title={games?.length ? 'No games match your search' : 'No games yet'}
          description={
            games?.length
              ? 'Try a different search term.'
              : 'Add your first game to enable it in tournament and team forms.'
          }
          action={
            !games?.length ? (
              <Button onClick={() => setFormOpen(true)}>Add game</Button>
            ) : undefined
          }
        />
      ) : (
        <AdminDataTable>
          <AdminDataTableHeader>
            <AdminDataTableRow>
              <AdminDataTableHead>Name</AdminDataTableHead>
              <AdminDataTableHead>Slug</AdminDataTableHead>
              <AdminDataTableHead>Status</AdminDataTableHead>
              <AdminDataTableHead>Tournaments</AdminDataTableHead>
              <AdminDataTableHead>Teams</AdminDataTableHead>
              <AdminDataTableHead className='w-[60px]' />
            </AdminDataTableRow>
          </AdminDataTableHeader>
          <AdminDataTableBody>
            {filteredGames.map((game) => (
              <AdminDataTableRow key={game.id}>
                <AdminDataTableCell className='font-medium'>{game.name}</AdminDataTableCell>
                <AdminDataTableCell className='text-muted-foreground font-mono text-xs'>
                  {game.slug}
                </AdminDataTableCell>
                <AdminDataTableCell>
                  <Badge variant={game.active ? 'default' : 'secondary'}>
                    {game.active ? 'Active' : 'Hidden'}
                  </Badge>
                </AdminDataTableCell>
                <AdminDataTableCell>{game._count.tournaments}</AdminDataTableCell>
                <AdminDataTableCell>{game._count.teams}</AdminDataTableCell>
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
                      <DropdownMenuItem onClick={() => setEditGame(game)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setToggleTarget({ game, active: !game.active })
                        }
                      >
                        {game.active ? 'Hide from forms' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive'
                        onClick={() => setDeleteTarget(game)}
                        disabled={game._count.tournaments > 0 || game._count.teams > 0}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AdminDataTableCell>
              </AdminDataTableRow>
            ))}
          </AdminDataTableBody>
        </AdminDataTable>
      )}

      <AdminGameFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode='create'
        isPending={createGame.isPending}
        onSubmit={handleCreate}
      />

      {editGame && (
        <AdminGameFormDialog
          open={!!editGame}
          onOpenChange={(open) => !open && setEditGame(null)}
          mode='edit'
          initial={{
            name: editGame.name,
            slug: editGame.slug,
            description: editGame.description ?? '',
            active: editGame.active,
          }}
          isPending={updateGame.isPending}
          onSubmit={handleEdit}
        />
      )}

      {deleteTarget && (
        <AdminConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title='Delete game'
          description={`Permanently delete "${deleteTarget.name}"? This only works if no tournaments or teams use it.`}
          confirmLabel='Delete'
          variant='destructive'
          isPending={deleteGame.isPending}
          onConfirm={() => deleteGame.mutate({ id: deleteTarget.id })}
        />
      )}

      {toggleTarget && (
        <AdminConfirmDialog
          open={!!toggleTarget}
          onOpenChange={(open) => !open && setToggleTarget(null)}
          title={toggleTarget.active ? 'Activate game' : 'Hide game'}
          description={
            toggleTarget.active
              ? `Show "${toggleTarget.game.name}" in tournament and team forms again?`
              : `Hide "${toggleTarget.game.name}" from new tournament and team forms? Existing data is kept.`
          }
          confirmLabel={toggleTarget.active ? 'Activate' : 'Hide'}
          isPending={updateGame.isPending}
          onConfirm={() =>
            updateGame.mutate({
              id: toggleTarget.game.id,
              name: toggleTarget.game.name,
              active: toggleTarget.active,
            })
          }
        />
      )}
    </div>
  )
}
