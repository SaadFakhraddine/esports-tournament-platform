"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, AlertCircle, Lock, LockOpen, Info } from "lucide-react"

interface TournamentFormProps {
  tournament?: {
    id: string
    name: string
    description?: string | null
    game: string
    format: string
    maxTeams: number
    startDate: Date
    endDate?: Date | null
    registrationStart?: Date
    registrationEnd?: Date
    rules?: string | null
    prizePool?: string | null
    banner?: string | null
    visibility?: string
    status?: string
  }
  mode?: "create" | "edit"
}

export function TournamentForm({ tournament, mode = "create" }: TournamentFormProps) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [error, setError] = useState<string | null>(null)
  const [isTogglingRegistration, setIsTogglingRegistration] = useState(false)

  // Fetch all games
  const { data: games, isLoading: gamesLoading } = trpc.game.getAll.useQuery()

  const [formData, setFormData] = useState({
    name: tournament?.name || "",
    description: tournament?.description || "",
    gameId: tournament?.game || "",
    format: tournament?.format || "SINGLE_ELIMINATION",
    maxTeams: tournament?.maxTeams || 8,
    startDate: tournament?.startDate ? new Date(tournament.startDate) : null,
    endDate: tournament?.endDate ? new Date(tournament.endDate) : null,
    registrationStart: tournament?.registrationStart ? new Date(tournament.registrationStart) : null,
    registrationEnd: tournament?.registrationEnd ? new Date(tournament.registrationEnd) : null,
    rules: tournament?.rules || "",
    prizePool: tournament?.prizePool || "",
    banner: tournament?.banner || "",
  })

  const createMutation = trpc.tournament.create.useMutation({
    onSuccess: (data) => {
      router.push(`/tournaments/${data.id}`)
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const updateMutation = trpc.tournament.update.useMutation({
    onSuccess: (data) => {
      // Redirect to the manage page after update
      router.push(`/dashboard/tournaments/${data.id}/edit`)
      router.refresh()
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const toggleRegistrationMutation = trpc.tournament.update.useMutation({
    onSuccess: () => {
      setIsTogglingRegistration(false)
      if (tournament?.id) {
        utils.tournament.getById.invalidate({ id: tournament.id })
      }
    },
    onError: (error) => {
      setError(error.message)
      setIsTogglingRegistration(false)
    },
  })

  const handleToggleRegistration = () => {
    if (!tournament?.id) return

    setIsTogglingRegistration(true)
    const currentStatus = tournament.status || "DRAFT"
    const isCurrentlyOpen = currentStatus === "REGISTRATION"

    const newStatus = isCurrentlyOpen
      ? "REGISTRATION"
      : (currentStatus === "IN_PROGRESS" ? "IN_PROGRESS" : "SEEDING")

    toggleRegistrationMutation.mutate({
      id: tournament.id,
      status: newStatus as "IN_PROGRESS" | "SEEDING" | "REGISTRATION",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError("Tournament name is required")
      return
    }

    if (!formData.gameId.trim()) {
      setError("Game is required")
      return
    }

    if (formData.maxTeams < 2) {
      setError("At least 2 teams are required")
      return
    }

    if (!formData.startDate) {
      setError("Start date is required")
      return
    }

    if (!formData.registrationStart) {
      setError("Registration start date is required")
      return
    }

    if (!formData.registrationEnd) {
      setError("Registration end date is required")
      return
    }

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      gameId: formData.gameId,
      format: formData.format as "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "SWISS",
      maxTeams: formData.maxTeams,
      startDate: formData.startDate!,
      endDate: formData.endDate || undefined,
      registrationStart: formData.registrationStart!,
      registrationEnd: formData.registrationEnd!,
      rules: formData.rules || undefined,
      prizePool: formData.prizePool || undefined,
      banner: formData.banner || undefined,
    }

    if (mode === "edit" && tournament?.id) {
      updateMutation.mutate({ id: tournament.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {mode === "create" ? "Create Tournament" : "Edit Tournament"}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Set up a new tournament with custom settings"
              : "Update tournament details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name *</Label>
              <Input
                id="name"
                placeholder="Summer Championship 2026"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your tournament..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          {/* Game & Format */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="game">Game *</Label>
              <Select
                value={formData.gameId}
                onValueChange={(value) =>
                  setFormData({ ...formData, gameId: value })
                }
                disabled={gamesLoading}
              >
                <SelectTrigger id="game">
                  <SelectValue placeholder={gamesLoading ? "Loading games..." : "Select a game"} />
                </SelectTrigger>
                <SelectContent>
                  {games?.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.icon && <span className="mr-2">{game.icon}</span>}
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Don&apos;t see your game? Contact an admin to add it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Tournament Format *</Label>
              <Select
                value={formData.format}
                onValueChange={(value) =>
                  setFormData({ ...formData, format: value })
                }
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_ELIMINATION">
                    Single Elimination
                  </SelectItem>
                  <SelectItem value="DOUBLE_ELIMINATION">
                    Double Elimination
                  </SelectItem>
                  <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                  <SelectItem value="SWISS">Swiss</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Max Teams */}
          <div className="space-y-2">
            <Label htmlFor="maxTeams">Max Teams *</Label>
            <Input
              id="maxTeams"
              type="number"
              min="2"
              max="128"
              value={formData.maxTeams}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxTeams: parseInt(e.target.value) || 0,
                })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Power of 2 recommended for single/double elimination (4, 8, 16, 32...)
            </p>
          </div>

          {/* Registration Dates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Registration Period</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Set when teams can register for your tournament
                </p>
              </div>
              {mode === "edit" && tournament?.id && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      tournament.status === "REGISTRATION"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                    }
                  >
                    {tournament.status === "REGISTRATION" ? "Open" : "Closed"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant={tournament.status === "REGISTRATION" ? "destructive" : "default"}
                    className={tournament.status === "REGISTRATION" ? "" : "gradient-purple"}
                    onClick={handleToggleRegistration}
                    disabled={isTogglingRegistration || tournament.status === "COMPLETED" || tournament.status === "CANCELLED"}
                  >
                    {isTogglingRegistration ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : tournament.status === "REGISTRATION" ? (
                      <Lock className="h-4 w-4 mr-2" />
                    ) : (
                      <LockOpen className="h-4 w-4 mr-2" />
                    )}
                    {tournament.status === "REGISTRATION" ? "Close" : "Open"}
                  </Button>
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="space-y-2">
                <Label htmlFor="registrationStart" className={mode === "edit" && tournament?.status !== "REGISTRATION" ? "text-muted-foreground" : ""}>
                  Registration Start *
                </Label>
                <DateTimePicker
                  selected={formData.registrationStart}
                  onChange={(date) =>
                    setFormData({ ...formData, registrationStart: date })
                  }
                  placeholderText="Select start date and time"
                  minDate={new Date()}
                  required
                  disabled={mode === "edit" && tournament?.status !== "REGISTRATION"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationEnd" className={mode === "edit" && tournament?.status !== "REGISTRATION" ? "text-muted-foreground" : ""}>
                  Registration End *
                </Label>
                <DateTimePicker
                  selected={formData.registrationEnd}
                  onChange={(date) =>
                    setFormData({ ...formData, registrationEnd: date })
                  }
                  placeholderText="Select end date and time"
                  minDate={formData.registrationStart || new Date()}
                  required
                  disabled={mode === "edit" && tournament?.status !== "REGISTRATION"}
                />
              </div>
            </div>
            {mode === "edit" && tournament?.status === "REGISTRATION" && (
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Registration is currently open. Teams can register now regardless of the scheduled dates above.
                  Click &quot;Close&quot; to manually lock registration.
                </AlertDescription>
              </Alert>
            )}
            {mode === "edit" && tournament?.status !== "REGISTRATION" && tournament?.status !== "COMPLETED" && tournament?.status !== "CANCELLED" && (
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Registration is currently closed. Date fields are disabled. Click &quot;Open&quot; to enable editing and allow teams to register.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tournament Dates */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Tournament Schedule</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Set when the tournament will take place
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <DateTimePicker
                  selected={formData.startDate}
                  onChange={(date) =>
                    setFormData({ ...formData, startDate: date })
                  }
                  placeholderText="Select tournament start"
                  minDate={formData.registrationEnd || new Date()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time (Optional)</Label>
                <DateTimePicker
                  selected={formData.endDate}
                  onChange={(date) =>
                    setFormData({ ...formData, endDate: date })
                  }
                  placeholderText="Select tournament end"
                  minDate={formData.startDate || new Date()}
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Additional Details</Label>

            <div className="space-y-2">
              <Label htmlFor="rules">Tournament Rules</Label>
              <Textarea
                id="rules"
                placeholder="List tournament rules, regulations, and guidelines..."
                value={formData.rules}
                onChange={(e) =>
                  setFormData({ ...formData, rules: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizePool">Prize Pool</Label>
              <Input
                id="prizePool"
                placeholder="e.g., $10,000 USD, 1st: $5000, 2nd: $3000, 3rd: $2000"
                value={formData.prizePool}
                onChange={(e) =>
                  setFormData({ ...formData, prizePool: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner">Banner Image URL</Label>
              <Input
                id="banner"
                type="url"
                placeholder="https://example.com/banner.jpg"
                value={formData.banner}
                onChange={(e) =>
                  setFormData({ ...formData, banner: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Recommended size: 1920x1080px
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="gradient-purple glow-purple-hover flex-1"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Tournament" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
