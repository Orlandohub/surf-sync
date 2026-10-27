"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSchoolAction } from "@/lib/actions/school";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { isEmail } from "@/components/school/email";
import { refocusWhenRemoved, revealFocusedField } from "@/components/school/focus";

type FieldName = "name" | "contactEmail" | "address" | "city";
const ORDER: FieldName[] = ["name", "contactEmail", "address", "city"];

/**
 * Mirrors createSchoolSchema (lib/services/school.ts) so mistakes show
 * next to the field before the round trip; the action still validates.
 */
function validate(v: Record<string, string>): Partial<Record<FieldName, true>> {
  const bad: Partial<Record<FieldName, true>> = {};
  if (v.name.length < 2 || v.name.length > 120) bad.name = true;
  if (!isEmail(v.contactEmail)) bad.contactEmail = true;
  if (v.address.length < 4 || v.address.length > 240) bad.address = true;
  if (v.city.length < 2 || v.city.length > 80) bad.city = true;
  return bad;
}

/**
 * "Cria a tua escola" — the whole Início for a school account with no
 * school yet. Three short groups (Escola · Contacto · Localização) in one
 * card; "Criar escola" pinned above the tab bar on phones, so there every
 * control keeps a bottom scroll margin of tab bar + CTA (WCAG 2.4.11).
 * On success the page refreshes into the school's Início, which then
 * opens at the top with focus on the school's name.
 */
export function CreateSchoolForm() {
  const t = useTranslations("SchoolDashboardPage.create");
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [errors, setErrors] = React.useState<Partial<Record<FieldName, true>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [refreshing, startTransition] = React.useTransition();

  function clear(name: FieldName) {
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    const values = Object.fromEntries(
      ["name", "description", "contactEmail", "contactPhone", "address", "city"].map((k) => [
        k,
        String(data.get(k) ?? "").trim(),
      ]),
    );
    const bad = validate(values);
    setErrors(bad);
    const first = ORDER.find((k) => bad[k]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setPending(true);
    const res = await createSchoolAction(values);
    setPending(false);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    toast(t("saved"));
    refocusWhenRemoved(formRef.current, () => {
      window.scrollTo({ top: 0 });
      return document.querySelector<HTMLElement>("#conteudo h1");
    });
    startTransition(() => router.refresh());
  }

  const err = (name: FieldName) => (errors[name] ? t(`errors.${name}`) : undefined);

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onFocus={revealFocusedField}
      // Tab bar + pinned CTA (5rem) + 0.5rem, rounded up to the scale.
      className="flex flex-col gap-section max-md:**:scroll-mb-48"
    >
      <div className="flex flex-col divide-y divide-border rounded-card border bg-card shadow-card">
        <section aria-labelledby="criar-escola" className="flex flex-col gap-4 p-card md:p-6">
          <h2 id="criar-escola" className="text-title-sm text-foreground">
            {t("schoolSection")}
          </h2>
          <Field label={t("name")} error={err("name")}>
            <Input name="name" autoComplete="organization" maxLength={120} onChange={() => clear("name")} />
          </Field>
          <Field label={t("descriptionField")} helper={t("descriptionHelper")}>
            <Textarea name="description" rows={3} maxLength={2000} />
          </Field>
        </section>

        <section aria-labelledby="criar-contacto" className="flex flex-col gap-4 p-card md:p-6">
          <h2 id="criar-contacto" className="text-title-sm text-foreground">
            {t("contactSection")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("contactEmail")} error={err("contactEmail")}>
              <Input
                name="contactEmail"
                type="email"
                autoComplete="email"
                onChange={() => clear("contactEmail")}
              />
            </Field>
            <Field label={t("contactPhone")}>
              <Input name="contactPhone" type="tel" autoComplete="tel" maxLength={30} />
            </Field>
          </div>
        </section>

        <section aria-labelledby="criar-localizacao" className="flex flex-col gap-4 p-card md:p-6">
          <h2 id="criar-localizacao" className="text-title-sm text-foreground">
            {t("locationSection")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("address")} error={err("address")} className="sm:col-span-2">
              <Input
                name="address"
                autoComplete="street-address"
                maxLength={240}
                onChange={() => clear("address")}
              />
            </Field>
            <Field label={t("city")} error={err("city")}>
              <Input name="city" autoComplete="address-level2" maxLength={80} onChange={() => clear("city")} />
            </Field>
          </div>
        </section>
      </div>

      {formError && <FieldError>{formError}</FieldError>}

      <div className="sticky bottom-(--bottom-chrome) z-20 -mx-gutter -mt-3 bg-background px-gutter pt-3 pb-4 md:static md:m-0 md:flex md:justify-end md:bg-transparent md:p-0">
        <Button
          type="submit"
          size="lg"
          className="md:h-11 md:w-auto"
          pending={pending || refreshing}
          pendingLabel={t("saving")}
        >
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
