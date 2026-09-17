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
      body: `${schoolName} pediu uma aula com ${instructorName} a ${when}. Responda no painel para aceitar ou recusar.`,
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
      <Body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "24px 0", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, padding: 32 }}>
          <Heading as="h1" style={{ fontSize: 20, marginTop: 0 }}>
            {c.title}
          </Heading>
          <Text style={{ fontSize: 14, color: "#3f3f46", lineHeight: "20px" }}>{c.body}</Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={dashboardUrl}
              style={{ backgroundColor: "#0f172a", borderRadius: 8, color: "#ffffff", fontSize: 14, fontWeight: 600, padding: "12px 20px" }}
            >
              Ver no SurfSync
            </Button>
          </Section>
          <Text style={{ fontSize: 12, color: "#71717a", lineHeight: "18px" }}>
            Se o botão não funcionar, abra este link no browser:
          </Text>
          <Link href={dashboardUrl} style={{ fontSize: 12, color: "#18181b", wordBreak: "break-all" }}>
            {dashboardUrl}
          </Link>
          <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#71717a", lineHeight: "18px" }}>
            Recebeu este email porque tem uma conta SurfSync associada a este evento.
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
