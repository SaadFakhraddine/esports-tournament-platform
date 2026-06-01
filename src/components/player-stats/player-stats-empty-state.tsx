import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PlayerStatsEmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No teams yet</CardTitle>
        <CardDescription>Join or create a team to start tracking match stats.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-wrap gap-3'>
        <Button asChild>
          <Link href='/teams'>Browse teams</Link>
        </Button>
        <Button variant='outline' asChild>
          <Link href='/teams/create'>Create a team</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
