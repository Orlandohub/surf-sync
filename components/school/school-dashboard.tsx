"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSchoolAction, inviteStaffAction } from "@/lib/actions/school";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { SchoolDashboardData } from "@/lib/services/school";

export function SchoolDashboard({ data }: { data: SchoolDashboardData }) {
  const t = useTranslations("SchoolDashboardPage");
  const router = useRouter();

  const [name, setName] = useState(data.school?.name ?? "");
  const [description, setDescription] = useState(data.school?.description ?? "");
  const [contactEmail, setContactEmail] = useState(data.school?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(data.school?.contactPhone ?? "");
  const [address, setAddress] = useState(data.school?.address ?? "");
  const [city, setCity] = useState(data.school?.city ?? "");
  const [schoolMsg, setSchoolMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingSchool, setSavingSchool] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  async function handleCreateSchool(e: React.FormEvent) {
    e.preventDefault();
    setSchoolMsg(null);
    setSavingSchool(true);
    const res = await createSchoolAction({
      name,
      description,
      contactEmail,
      contactPhone,
      address,
      city,
    });
    setSavingSchool(false);
    if (res.ok) {
      setSchoolMsg({ ok: true, text: t("create.saved") });
      router.refresh();
    } else {
      setSchoolMsg({ ok: false, text: res.error });
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteMsg(null);
    setInviting(true);
    const res = await inviteStaffAction({ email: inviteEmail });
    setInviting(false);
    if (res.ok) {
      setInviteMsg({ ok: true, text: t("staff.invited") });
      setInviteEmail("");
      router.refresh();
    } else {
      setInviteMsg({ ok: false, text: res.error });
    }
  }

  if (!data.school) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>{t("create.title")}</CardTitle>
            <CardDescription>{t("create.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSchool} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="school-name">{t("create.name")}</Label>
                <Input id="school-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="school-description">{t("create.descriptionField")}</Label>
                <Textarea id="school-description" value={description ?? ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="school-email">{t("create.contactEmail")}</Label>
                <Input id="school-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="school-phone">{t("create.contactPhone")}</Label>
                <Input id="school-phone" value={contactPhone ?? ""} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="school-address">{t("create.address")}</Label>
                <Input id="school-address" value={address} onChange={(e) => setAddress(e.target.value)} required minLength={4} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="school-city">{t("create.city")}</Label>
                <Input id="school-city" value={city} onChange={(e) => setCity(e.target.value)} required minLength={2} />
              </div>
              {schoolMsg && (
                <p className={`text-sm ${schoolMsg.ok ? "text-muted-foreground" : "text-destructive"}`} role="status">
                  {schoolMsg.text}
                </p>
              )}
              <Button type="submit" disabled={savingSchool}>
                {savingSchool ? t("create.saving") : t("create.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-1">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{data.school.name}</h1>
        <p className="text-sm text-muted-foreground">
          {data.school.address}, {data.school.city}
        </p>
        <Link href="/school/discovery" className="text-sm text-muted-foreground underline underline-offset-4">
          {t("findInstructors")} →
        </Link>
        <Link href="/school/bookings" className="text-sm text-muted-foreground underline underline-offset-4">
          {t("viewBookings")} →
        </Link>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t("staff.title")}</CardTitle>
          <CardDescription>{t("staff.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {data.staff.map((member) => (
              <li key={member.userId} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-xs text-muted-foreground">{member.email}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("staff.joined")} {new Date(member.joinedAt).toLocaleDateString("pt-PT")}
                </span>
              </li>
            ))}
          </ul>

          {data.pendingInvites.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t("staff.pending")}</p>
              {data.pendingInvites.map((inv) => (
                <div key={inv.email} className="flex items-center justify-between rounded-lg border border-dashed border-border p-3">
                  <span className="text-sm">{inv.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("staff.expires")} {new Date(inv.expiresAt).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="invite-email">{t("staff.inviteLabel")}</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colega@escola.pt"
                required
              />
            </div>
            <Button type="submit" disabled={inviting}>
              {inviting ? t("staff.inviting") : t("staff.invite")}
            </Button>
          </form>
          {inviteMsg && (
            <p className={`text-sm ${inviteMsg.ok ? "text-muted-foreground" : "text-destructive"}`} role="status">
              {inviteMsg.text}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
