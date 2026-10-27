"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Password field with a show/hide toggle. Put it inside a <Field> like an
 * Input — the Field wires id, aria-describedby and aria-invalid onto the
 * inner input (an `id` given here is adopted by the Field).
 *
 * The toggle is a 48px icon button inside the control (≥ 44px target),
 * named "Mostrar palavra-passe" with aria-pressed for its state.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const t = useTranslations("Auth.password");
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div data-slot="password-input" className="relative">
      <Input
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        aria-label={t("show")}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center rounded-r-control text-muted-foreground outline-none transition-colors duration-(--duration-fast) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <Icon aria-hidden className="size-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
