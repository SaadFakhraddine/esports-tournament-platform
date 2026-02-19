"use client"

import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 max-w-md w-full">
      {toasts.map((toast) => (
        <Alert
          key={toast.id}
          variant={toast.variant === "destructive" ? "destructive" : "default"}
          className="relative animate-fade-in"
        >
          <div className="pr-8">
            {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
            {toast.description && (
              <AlertDescription>{toast.description}</AlertDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => dismiss(toast.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  )
}
