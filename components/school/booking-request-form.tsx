"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarWave } from "@/components/brand/icons";
import { requestBookingAction } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldError, FieldHelper } from "@/components/ui/field";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimeSelect } from "@/components/ui/time-select";
import { toast } from "@/components/ui/toast";
import { formatDayDate } from "@/lib/format";
import {
  STEP,
  bookableDates,
  earliestStart,
  fromMinutes,
  slotFor,
  toMinutes,
  type Slot,
} from "@/components/school/booking-slots";

const HOURS = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });
/** Default lesson length when a day is picked. */
const DEFAULT_MINUTES = 120;

/**
 * "Pedir aula" on an instructor's profile. Only offers what the instructor
 * can take: upcoming dates on their available weekdays, then start and end
 * times inside that day's range (24 h TimeSelects, 30 min steps). Today
 * only counts while a start time is still ahead, and then only from the
 * next half hour (booking-slots.ts). It's a native Select with
 * DateSelect's labels, since DateSelect can't drop today. `now` comes from
 * the server render so the server and client lists match. The server
 * still checks everything (requestBooking: inside the weekly availability,
 * no overlap, not in the past) and its message shows inline.
 *
 * Layout: a card in the right column from lg. Below lg the form box is
 * `display: contents`, so "Enviar pedido" can stay pinned above the tab
 * bar for the whole page (DESIGN.md "One job per screen").
 */
export function BookingRequestForm({
  instructorId,
  slots,
  now,
}: {
  instructorId: string;
  slots: readonly Slot[];
  /** Epoch ms of the server render. */
  now: number;
}) {
  const t = useTranslations("BookingRequestForm");
  const router = useRouter();
  const dateRef = React.useRef<HTMLSelectElement>(null);
  const [date, setDate] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [dateError, setDateError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const dates = bookableDates(slots, now);
  const slot = date ? slotFor(slots, date) : undefined;
  const firstStart = date && slot ? fromMinutes(earliestStart(date, slot, now)) : undefined;

  if (slots.length === 0) {
    return (
      <section aria-labelledby="pedir-aula" className="flex flex-col gap-3 lg:col-span-2">
        <SectionHeading id="pedir-aula" title={t("title")} />
        <EmptyState
          icon={CalendarWave}
          as="h3"
          title={t("noAvailability.title")}
          description={t("noAvailability.description")}
        />
      </section>
    );
  }

  function pickDate(value: string) {
    setDate(value);
    setDateError(null);
    setFormError(null);
    const s = slotFor(slots, value);
    if (!s) return;
    const first = earliestStart(value, s, now);
    setStart(fromMinutes(first));
    setEnd(fromMinutes(Math.min(first + DEFAULT_MINUTES, toMinutes(s.end))));
  }

  function pickStart(value: string) {
    if (!slot) return;
    setFormError(null);
    // Keep the length the person chose, inside the day's range.
    const length = Math.max(toMinutes(end) - toMinutes(start), STEP);
    setStart(value);
    setEnd(fromMinutes(Math.min(toMinutes(value) + length, toMinutes(slot.end))));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!date || !slot) {
      setDateError(t("errors.date"));
      dateRef.current?.focus();
      return;
    }
    if (toMinutes(end) <= toMinutes(start)) {
      setFormError(t("errors.time"));
      return;
    }
    setPending(true);
    const res = await requestBookingAction({
      instructorId,
      bookingDate: date,
      startTime: start,
      endTime: end,
      notes,
    });
    setPending(false);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    toast(t("sent"), {
      action: { label: t("viewBookings"), onClick: () => router.push("/school/bookings") },
    });
    setDate("");
    setStart("");
    setEnd("");
    setNotes("");
  }

  const minutes = slot && start && end ? toMinutes(end) - toMinutes(start) : 0;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby="pedir-aula"
      className="max-lg:contents lg:col-span-2 lg:flex lg:flex-col lg:gap-5 lg:rounded-card lg:border lg:bg-card lg:p-card lg:shadow-card"
    >
      <div className="flex flex-col gap-3 lg:gap-4">
        <SectionHeading id="pedir-aula" title={t("title")} description={t("description")} />
        <div className="flex flex-col gap-4 max-lg:rounded-card max-lg:border max-lg:bg-card max-lg:p-card max-lg:shadow-card">
          <Field
            label={t("date")}
            error={dateError}
            helper={slot ? t("range", { start: slot.start, end: slot.end }) : undefined}
          >
            <Select
              ref={dateRef}
              name="bookingDate"
              required
              value={date}
              onChange={(e) => pickDate(e.target.value)}
            >
              <option value="" disabled>
                {t("datePlaceholder")}
              </option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDayDate(d, { now })}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("start")}>
                <TimeSelect
                  name="startTime"
                  disabled={!slot}
                  placeholder={slot ? undefined : t("timePlaceholder")}
                  value={slot ? start : ""}
                  min={firstStart}
                  max={slot ? fromMinutes(toMinutes(slot.end) - STEP) : undefined}
                  step={STEP}
                  onChange={(e) => pickStart(e.target.value)}
                />
              </Field>
              <Field label={t("end")}>
                <TimeSelect
                  name="endTime"
                  disabled={!slot}
                  placeholder={slot ? undefined : t("timePlaceholder")}
                  value={slot ? end : ""}
                  min={slot && start ? fromMinutes(toMinutes(start) + STEP) : undefined}
                  max={slot?.end}
                  step={STEP}
                  onChange={(e) => {
                    setFormError(null);
                    setEnd(e.target.value);
                  }}
                />
              </Field>
            </div>
            {minutes > 0 && (
              <FieldHelper aria-live="polite">
                {t("duration", { duration: `${HOURS.format(minutes / 60)} h` })}
              </FieldHelper>
            )}
          </div>
          <Field label={t("notes")} helper={t("notesHelper")}>
            <Textarea
              name="notes"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          {formError && <FieldError>{formError}</FieldError>}
        </div>
      </div>
      <div className="sticky bottom-(--bottom-chrome) z-20 -mx-gutter -mt-3 bg-background px-gutter pt-3 pb-4 lg:static lg:m-0 lg:bg-transparent lg:p-0">
        <Button type="submit" size="lg" pending={pending} pendingLabel={t("submitting")}>
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
