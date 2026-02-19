import Link from "next/link"
import { Calendar, Users, Trophy } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TournamentCardProps {
  tournament: {
    id: string
    name: string
    game: {
      id: string
      name: string
      slug: string
      icon?: string | null
    }
    format: string
    maxTeams: number
    startDate: Date
    status: string
    _count?: {
      registrations: number
    }
  }
}

const statusConfig = {
  UPCOMING: {
    label: "Upcoming",
    variant: "default" as const,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  REGISTRATION_OPEN: {
    label: "Registration Open",
    variant: "success" as const,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  REGISTRATION_CLOSED: {
    label: "Registration Closed",
    variant: "warning" as const,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  IN_PROGRESS: {
    label: "Live",
    variant: "live" as const,
    className: "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse",
  },
  COMPLETED: {
    label: "Completed",
    variant: "secondary" as const,
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
}

const formatConfig: Record<string, { label: string; icon: string }> = {
  SINGLE_ELIMINATION: { label: "Single Elim", icon: "🏆" },
  DOUBLE_ELIMINATION: { label: "Double Elim", icon: "🥇" },
  ROUND_ROBIN: { label: "Round Robin", icon: "🔄" },
  SWISS: { label: "Swiss", icon: "🎯" },
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const status = statusConfig[tournament.status as keyof typeof statusConfig] || statusConfig.UPCOMING
  const format = formatConfig[tournament.format as keyof typeof formatConfig] || formatConfig.SINGLE_ELIMINATION
  const registeredTeams = tournament._count?.registrations || 0
  const isFull = registeredTeams >= tournament.maxTeams

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card className="group relative overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-300 glow-purple-hover h-full flex flex-col">
        {/* Status badge - absolute positioned */}
        <div className="absolute top-4 right-4 z-10">
          <Badge className={cn("border", status.className)}>
            {status.label}
          </Badge>
        </div>

        <CardHeader className="space-y-3">
          {/* Game badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {tournament.game.icon && <span className="mr-1">{tournament.game.icon}</span>}
              {tournament.game.name}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {format.icon} {format.label}
            </Badge>
          </div>

          {/* Tournament name */}
          <h3 className="text-xl font-bold leading-tight line-clamp-2 group-hover:text-gradient-purple-cyan transition-all duration-300">
            {tournament.name}
          </h3>
        </CardHeader>

        <CardContent className="flex-1 space-y-3">
          {/* Start date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(tournament.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Teams count */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {registeredTeams} / {tournament.maxTeams} Teams
                </span>
                <span className={cn(
                  "font-medium",
                  isFull ? "text-destructive" : "text-accent"
                )}>
                  {isFull ? "Full" : `${tournament.maxTeams - registeredTeams} spots`}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isFull ? "bg-destructive" : "bg-gradient-purple-cyan"
                  )}
                  style={{
                    width: `${Math.min((registeredTeams / tournament.maxTeams) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border pt-4">
          <Button
            className={cn(
              "w-full transition-all duration-300",
              tournament.status === "IN_PROGRESS" ? "gradient-purple glow-purple" : "gradient-cyan glow-cyan-hover"
            )}
            size="sm"
          >
            {tournament.status === "IN_PROGRESS" ? (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                Watch Live
              </>
            ) : tournament.status === "REGISTRATION_OPEN" ? (
              "Register Now"
            ) : (
              "View Details"
            )}
          </Button>
        </CardFooter>

        {/* Hover effect gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Card>
    </Link>
  )
}
