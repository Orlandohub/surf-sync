import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  render,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import type {
  BookingEventType,
  NotificationPayload,
  NotificationRecipient,
} from "@/lib/services/notifications";
import { formatDate, formatTimeRange } from "@/lib/format";

// surfsync email brand — Atlantic palette (docs/design/DESIGN.md).
const ink = "#0D1B2A";
const muted = "#525F6D";
const faint = "#6F7C8A";
const hairline = "#E7ECEF";
const teal = "#017473";
const canvas = "#F3F6F8";

function Lockup() {
  return (
    <Text style={{ margin: "0 0 24px", fontSize: 18, lineHeight: "24px", color: ink, fontFamily: "system-ui, sans-serif" }}>
      <span style={{ fontWeight: 400 }}>surf</span>
      <span style={{ fontWeight: 700 }}>sync</span>
    </Text>
  );
}

function BookingNotificationEmail({
  type,
  payload,
  dashboardUrl,
}: {
  type: BookingEventType;
  payload: NotificationPayload;
  dashboardUrl: string;
}) {
  const { schoolName, instructorName, bookingDate, startTime, endTime, byUserName } = payload;
  // Absolute date, not "Amanhã": emails are read later. "28 de outubro, 9:00–11:00".
  const date = formatDate(bookingDate);
  const when = `${date}, ${formatTimeRange(startTime, endTime)}`;

  // booking_requested goes to the instructor; accepted and declined to the
  // school's requester; cancelled to the other side.
  const copy: Record<BookingEventType, { preview: string; title: string; body: string }> = {
    booking_requested: {
      preview: `${schoolName} pediu-te uma aula para ${date}.`,
      title: "Novo pedido de aula",
      body: `${schoolName} pediu-te uma aula para ${when}. Abre o surfsync para aceitares ou recusares.`,
    },
    booking_accepted: {
      preview: `${instructorName} confirmou a aula de ${date}.`,
      title: "Aula confirmada",
      body: `${instructorName} confirmou a aula de ${schoolName} para ${when}.`,
    },
    booking_declined: {
      preview: `${instructorName} recusou o pedido de ${date}.`,
      title: "Pedido recusado",
      body: `${instructorName} recusou o pedido de aula de ${schoolName} para ${when}.${
        payload.declineReason ? ` Motivo: ${payload.declineReason}` : ""
      }`,
    },
    booking_cancelled: {
      preview: `A aula de ${date} foi cancelada.`,
      title: "Aula cancelada",
      body: byUserName
        ? `${byUserName} cancelou a aula de ${schoolName} com ${instructorName} para ${when}.`
        : `Foi cancelada a aula de ${schoolName} com ${instructorName} para ${when}.`,
    },
  };

  const c = copy[type];

  return (
    <Html lang="pt-PT">
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "24px 0", backgroundColor: canvas }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 16, padding: 32 }}>
          <Lockup />
          <Heading as="h1" style={{ fontSize: 20, lineHeight: "28px", marginTop: 0, color: ink }}>
            {c.title}
          </Heading>
          <Text style={{ fontSize: 15, lineHeight: "22px", color: muted }}>{c.body}</Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={dashboardUrl}
              style={{ backgroundColor: teal, borderRadius: 12, color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "12px 20px" }}
            >
              Abrir surfsync
            </Button>
          </Section>
          <Text style={{ fontSize: 13, lineHeight: "18px", color: muted }}>
            Se o botão não funcionar, copia este link para o navegador:
          </Text>
          <Link href={dashboardUrl} style={{ fontSize: 13, color: teal, wordBreak: "break-all" }}>
            {dashboardUrl}
          </Link>
          <Hr style={{ borderColor: hairline, margin: "24px 0" }} />
          <Text style={{ fontSize: 12, lineHeight: "16px", color: faint }}>
            Recebeste este email porque tens uma conta no surfsync ligada a esta aula.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/**
 * "Abrir surfsync" opens the recipient's own bookings screen, on the tab
 * where this event put the booking: a new request on the instructor's
 * Pedidos, a cancellation in either side's Histórico, a confirmation in
 * the school's Próximas.
 */
export function bookingEmailPath(type: BookingEventType, recipient: NotificationRecipient): string {
  if (recipient === "instructor") {
    return type === "booking_requested"
      ? "/instructor/bookings?tab=requests"
      : type === "booking_accepted"
        ? "/instructor/bookings?tab=upcoming"
        : "/instructor/bookings?tab=history";
  }
  return type === "booking_requested"
    ? "/school/bookings"
    : type === "booking_accepted"
      ? "/school/bookings?tab=upcoming"
      : "/school/bookings?tab=history";
}

export async function renderBookingNotificationEmail(
  type: BookingEventType,
  payload: NotificationPayload,
  recipient: NotificationRecipient,
): Promise<{ html: string; text: string }> {
  const base = process.env.BETTER_AUTH_URL?.replace(/\/api\/auth$/, "") ?? "https://www.surfsync.org";
  const dashboardUrl = `${base}${bookingEmailPath(type, recipient)}`;
  const html = await render(
    <BookingNotificationEmail type={type} payload={payload} dashboardUrl={dashboardUrl} />,
    { plainText: false },
  );
  const text = await render(
    <BookingNotificationEmail type={type} payload={payload} dashboardUrl={dashboardUrl} />,
    { plainText: true },
  );
  return { html, text };
}
