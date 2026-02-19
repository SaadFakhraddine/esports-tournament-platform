"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { trpc } from "@/lib/trpc/client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Search, Plus } from "lucide-react"

export default function TeamsPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = trpc.team.getAll.useQuery({
    limit: 20,
  })

  const filteredTeams = data?.teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout userRole={session?.user?.role}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground mt-2">
              Browse teams and join competitive rosters
            </p>
          </div>
          <Link href="/teams/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search teams by name or tag..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-6 w-32 mt-2" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTeams && filteredTeams.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No teams found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Be the first to create a team"}
              </p>
              {!searchQuery && (
                <Link href="/teams/create">
                  <Button>Create Team</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Teams Grid */}
        {!isLoading && filteredTeams && filteredTeams.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg transition-all hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-purple text-white font-bold">
                        {team.tag || team.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate flex items-center gap-2">
                        {team.name}
                        {team.tag && (
                          <Badge variant="secondary" className="text-xs">
                            {team.tag}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="truncate">{team.game.name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {team.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{team._count.members} members</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Owner: {team.owner.name || "Unknown"}
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/teams/${team.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      View Team
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
