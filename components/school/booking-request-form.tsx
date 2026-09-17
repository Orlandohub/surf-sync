"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestBookingAction } from "@/lib/actions/booking";
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

export function BookingRequestForm({ instructorId }: { instructorId: string }) {
  const t = useTranslations("BookingRequestForm");
  const router = useRouter();
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    const res = await requestBookingAction({
      instructorId,
      bookingDate: date,
      startTime: start,
      endTime: end,
      notes,
    });
    setPending(false);
    if (res.ok) {
      setMsg({ ok: true, text: t("requested") });
      setDate(""); setStart(""); setEnd(""); setNotes("");
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="booking-date">{t("date")}</Label>
              <Input
                id="booking-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="booking-start">{t("start")}</Label>
              <Input
                id="booking-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="booking-end">{t("end")}</Label>
              <Input
                id="booking-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-notes">{t("notes")}</Label>
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              maxLength={1000}
              rows={2}
            />
          </div>
          {msg && (
            <p className={`text-sm ${msg.ok ? "text-muted-foreground" : "text-destructive"}`} role="status">
              {msg.text}
            </p>
          )}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
