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
import type { BookingEventType, NotificationPayload } from "@/lib/services/notifications";

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
  const { schoolName, instructorName, bookingDate, startTime, endTime } = payload;
  const when = `${bookingDate} · ${startTime.slice(0, 5)}–${endTime.slice(0, 5)}`;

  const copy: Record<BookingEventType, { preview: string; title: string; body: string }> = {
    booking_requested: {
      preview: `${schoolName} pediu uma aula a ${instructorName}`,
      title: "Novo pedido de reserva",
      body: `${schoolName} pediu uma aula com ${instructorName} a ${when}. Responde no painel para aceitares ou recusares.`,
    },
    booking_accepted: {
      preview: `${instructorName} aceitou a reserva de ${schoolName}`,
      title: "Reserva confirmada",
      body: `${instructorName} confirmou a aula de ${schoolName} a ${when}.`,
    },
    booking_declined: {
      preview: `${instructorName} não pode aceitar o pedido`,
      title: "Pedido recusado",
      body: `${instructorName} não pode aceitar a aula de ${schoolName} a ${when}.${
        payload.declineReason ? ` Motivo: ${payload.declineReason}` : ""
      }`,
    },
    booking_cancelled: {
      preview: `Reserva de ${bookingDate} cancelada`,
      title: "Reserva cancelada",
      body: `A reserva entre ${schoolName} e ${instructorName} a ${when} foi cancelada por ${
        payload.byUserName ?? "uma das partes"
      }.`,
    },
  };

  const c = copy[type];

  return (
    <Html lang="pt">
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
              Ver no SurfSync
            </Button>
          </Section>
          <Text style={{ fontSize: 13, lineHeight: "18px", color: muted }}>
            Se o botão não funcionar, abre este link no browser:
          </Text>
          <Link href={dashboardUrl} style={{ fontSize: 13, color: teal, wordBreak: "break-all" }}>
            {dashboardUrl}
          </Link>
          <Hr style={{ borderColor: hairline, margin: "24px 0" }} />
          <Text style={{ fontSize: 12, lineHeight: "16px", color: faint }}>
            Recebeste este email porque tens uma conta SurfSync associada a este evento.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderBookingNotificationEmail(
  type: BookingEventType,
  payload: NotificationPayload,
): Promise<{ html: string; text: string }> {
  const base = process.env.BETTER_AUTH_URL?.replace(/\/api\/auth$/, "") ?? "https://www.surfsync.org";
  const dashboardUrl = `${base}${type === "booking_requested" ? "/instructor" : "/school"}`;
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
