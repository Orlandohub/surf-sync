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

export function StaffInvitationEmail({
  schoolName,
  signupUrl,
}: {
  schoolName: string;
  signupUrl: string;
}) {
  return (
    <Html lang="pt-PT">
      <Head />
      <Preview>Junta-te à equipa de {schoolName} no surfsync.</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "24px 0", backgroundColor: canvas }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 16, padding: 32 }}>
          <Lockup />
          <Heading as="h1" style={{ fontSize: 20, lineHeight: "28px", marginTop: 0, color: ink }}>
            Junta-te à equipa de {schoolName}
          </Heading>
          <Text style={{ fontSize: 15, lineHeight: "22px", color: muted }}>
            Recebeste um convite para gerires {schoolName} no surfsync: encontrar
            instrutores e pedir aulas para a escola. O convite é válido durante
            7 dias.
          </Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={signupUrl}
              style={{ backgroundColor: teal, borderRadius: 12, color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "12px 20px" }}
            >
              Criar conta
            </Button>
          </Section>
          <Text style={{ fontSize: 13, lineHeight: "18px", color: muted }}>
            Se o botão não funcionar, copia este link para o navegador:
          </Text>
          <Link href={signupUrl} style={{ fontSize: 13, color: teal, wordBreak: "break-all" }}>
            {signupUrl}
          </Link>
          <Hr style={{ borderColor: hairline, margin: "24px 0" }} />
          <Text style={{ fontSize: 12, lineHeight: "16px", color: faint }}>
            Para aceitares, cria conta com este email e escolhe «Escola de surf»:
            a tua conta fica logo ligada à escola. Não estavas à espera deste
            convite? Podes ignorar este email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderStaffInvitationEmail(
  schoolName: string,
  signupUrl: string,
): Promise<{ html: string; text: string }> {
  const html = await render(<StaffInvitationEmail schoolName={schoolName} signupUrl={signupUrl} />, { plainText: false });
  const text = await render(<StaffInvitationEmail schoolName={schoolName} signupUrl={signupUrl} />, { plainText: true });
  return { html, text };
}
