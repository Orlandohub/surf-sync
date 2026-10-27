"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { Toaster as Sonner, toast as sonnerToast } from "sonner"

/**
 * surfsync DS (COMPONENTS.md "Toast") — sonner, restyled.
 * `bg-inverse text-inverse-foreground rounded-control shadow-float`,
 * bottom-centre above the tab bar, 4 s. One <Toaster /> is mounted in the
 * root layout; call `toast()` from any Client Component:
 *
 *   toast("Alterações guardadas.")                    // reuse the CTA verb
 *   toast("Pedido enviado à escola.", { action: { label: "Ver pedido", onClick: () => router.push(href) } })
 *   toast.error("Não foi possível guardar. Verifica a ligação e tenta novamente.")
 *
 * Rules: past participle of the CTA verb ("Guardar alterações" →
 * "Alterações guardadas."); at most one action; errors the person must fix
 * go inline next to the field (<FieldError>), not in a toast.
 */

type ToastOptions = {
  description?: React.ReactNode
  /** One action, rendered as a link. */
  action?: { label: React.ReactNode; onClick: () => void }
  /** Milliseconds. Default 4000. */
  duration?: number
  id?: string | number
}

function show(message: React.ReactNode, options: ToastOptions = {}) {
  const { action, ...rest } = options
  return sonnerToast(message, {
    ...rest,
    action: action ? { label: action.label, onClick: () => action.onClick() } : undefined,
  })
}

/** Confirms something happened. */
export const toast = Object.assign(show, {
  /** Something failed that can't be fixed inline (e.g. an immediate-apply switch). */
  error: (message: React.ReactNode, options: ToastOptions = {}) => {
    const { action, ...rest } = options
    return sonnerToast.error(message, {
      ...rest,
      action: action ? { label: action.label, onClick: () => action.onClick() } : undefined,
    })
  },
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
})

// Toasts float above the tab bar (and the home indicator) on mobile.
const OFFSET = { bottom: "calc(var(--bottom-chrome) + 1rem)" }
const MOBILE_OFFSET = {
  bottom: "calc(var(--bottom-chrome) + 0.75rem)",
  left: "var(--spacing-gutter)",
  right: "var(--spacing-gutter)",
}

export function Toaster() {
  const t = useTranslations("UI")
  return (
    <Sonner
      position="bottom-center"
      duration={4000}
      gap={8}
      offset={OFFSET}
      mobileOffset={MOBILE_OFFSET}
      containerAriaLabel={t("toastRegion")}
      icons={{
        error: <CircleAlert aria-hidden className="size-5" strokeWidth={1.75} />,
        success: null,
        info: null,
        warning: null,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-control bg-inverse px-4 py-3 text-body text-inverse-foreground shadow-float",
          content: "flex min-w-0 flex-1 flex-col gap-0.5",
          title: "text-body",
          description: "text-meta opacity-80",
          icon: "flex size-5 shrink-0 items-center justify-center",
          actionButton:
            "tap shrink-0 cursor-pointer rounded-chip text-label text-inverse-primary underline-offset-4 outline-none hover:underline " +
            "focus-visible:underline focus-visible:ring-2 focus-visible:ring-inverse-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse",
        },
      }}
    />
  )
}
