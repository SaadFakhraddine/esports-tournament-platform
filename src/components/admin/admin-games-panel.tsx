'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

export function AdminGamesPanel() {
  const utils = trpc.useUtils()
  const { data: games, isLoading } = trpc.admin.listGames.useQuery()
  const createGame = trpc.admin.createGame.useMutation({
    onSuccess: () => {
      void utils.admin.listGames.invalidate()
      setName('')
      setSlug('')
      setDescription('')
    },
  })
  const updateGame = trpc.admin.updateGame.useMutation({
    onSuccess: () => void utils.admin.listGames.invalidate(),
  })
  const deleteGame = trpc.admin.deleteGame.useMutation({
    onSuccess: () => void utils.admin.listGames.invalidate(),
  })

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createGame.mutate({
      name,
      slug: slug || undefined,
      description: description || null,
      active: true,
    })
  }

  if (isLoading) {
    return <Skeleton className='h-64 w-full' />
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Add game</CardTitle>
          <CardDescription>New games appear in tournament and team forms.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='game-name'>Name</Label>
              <Input
                id='game-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Valorant'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='game-slug'>Slug (optional)</Label>
              <Input
                id='game-slug'
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder='valorant'
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='game-desc'>Description</Label>
              <Textarea
                id='game-desc'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <Button type='submit' disabled={createGame.isPending}>
              Add game
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className='space-y-3'>
        {games?.map((game) => (
          <Card key={game.id}>
            <CardContent className='flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <div className='flex items-center gap-2'>
                  <p className='font-semibold'>{game.name}</p>
                  <Badge variant={game.active ? 'default' : 'secondary'}>
                    {game.active ? 'Active' : 'Hidden'}
                  </Badge>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {game.slug} · {game._count.tournaments} tournaments · {game._count.teams} teams
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={updateGame.isPending}
                  onClick={() =>
                    updateGame.mutate({ id: game.id, name: game.name, active: !game.active })
                  }
                >
                  {game.active ? 'Hide' : 'Activate'}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={deleteGame.isPending}
                  onClick={() => {
                    if (confirm(`Delete ${game.name}? Only works if unused.`)) {
                      deleteGame.mutate({ id: game.id })
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
