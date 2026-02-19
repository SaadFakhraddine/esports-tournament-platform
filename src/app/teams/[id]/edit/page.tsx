"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect, useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc/client"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EditTeamPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const teamId = params.id as string

  const { data: team, isLoading } = trpc.team.getById.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  )

  const updateTeamMutation = trpc.team.update.useMutation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    logo: "",
    description: "",
  })

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        tag: team.tag || "",
        logo: team.logo || "",
        description: team.description || "",
      })
    }
  }, [team])

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout userRole={session?.user?.role}>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    redirect("/login")
  }

  if (!team) {
    return (
      <DashboardLayout userRole={session.user.role}>
        <div className="text-center py-12">
          <p className="text-lg font-medium">Team not found</p>
        </div>
      </DashboardLayout>
    )
  }

  // Check if user is the team owner
  if (team.owner.id !== session.user.id) {
    return (
      <DashboardLayout userRole={session.user.role}>
        <div className="text-center py-12">
          <p className="text-lg font-medium">You don&apos;t have permission to edit this team</p>
        </div>
      </DashboardLayout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateTeamMutation.mutateAsync({
        id: teamId,
        name: formData.name !== team.name ? formData.name : undefined,
        tag: formData.tag !== team.tag ? (formData.tag || undefined) : undefined,
        logo: formData.logo !== team.logo ? (formData.logo || undefined) : undefined,
        description: formData.description !== team.description ? (formData.description || undefined) : undefined,
      })

      toast({
        title: "Success!",
        description: "Team updated successfully",
      })

      router.push(`/teams/${teamId}`)
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update team",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout userRole={session.user.role}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Team</h1>
          <p className="text-muted-foreground mt-2">
            Update your team&apos;s information
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              Make changes to your team details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Team Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Phoenix Legends"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  minLength={3}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a unique name for your team (3-50 characters)
                </p>
              </div>

              {/* Team Tag */}
              <div className="space-y-2">
                <Label htmlFor="tag">Team Tag (Optional)</Label>
                <Input
                  id="tag"
                  placeholder="e.g., PHX"
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value.toUpperCase() })
                  }
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  A short abbreviation for your team (2-10 characters)
                </p>
              </div>

              {/* Game (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="game">Game</Label>
                <Input
                  id="game"
                  value={team.registrations[0]?.tournament?.game?.name || "N/A"}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Game cannot be changed after team creation
                </p>
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL (Optional)</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Direct link to your team&apos;s logo image
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your team..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/teams/${teamId}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
