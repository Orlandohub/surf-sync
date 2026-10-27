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

// surfsync email brand — Atlantic palette (docs/design/DESIGN.md). Emails
// render outside the app, so tokens are pinned hex, not CSS vars.
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

export function VerificationEmail({
  url,
}: {
  url: string;
}) {
  return (
    <Html lang="pt-PT">
      <Head />
      <Preview>Abre o link para confirmares o teu email.</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "24px 0", backgroundColor: canvas }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 16, padding: 32 }}>
          <Lockup />
          <Heading as="h1" style={{ fontSize: 20, lineHeight: "28px", marginTop: 0, color: ink }}>
            Confirma o teu email
          </Heading>
          <Text style={{ fontSize: 15, lineHeight: "22px", color: muted }}>
            Usa o botão abaixo para confirmares o teu email no surfsync. O link
            é válido durante 24 horas e só pode ser usado uma vez.
          </Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Button
              href={url}
              style={{ backgroundColor: teal, color: "#ffffff", padding: "12px 24px", borderRadius: 12, textDecoration: "none", fontSize: 15, fontWeight: 600 }}
            >
              Confirmar email
            </Button>
          </Section>
          <Text style={{ fontSize: 13, lineHeight: "18px", color: muted }}>
            Se o botão não funcionar, copia este link para o navegador:{" "}
            <Link href={url} style={{ color: teal, wordBreak: "break-all" }}>
              {url}
            </Link>
          </Text>
          <Hr style={{ borderColor: hairline, margin: "24px 0" }} />
          <Text style={{ fontSize: 12, lineHeight: "16px", color: faint }}>
            Não criaste uma conta no surfsync? Podes ignorar este email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderVerificationEmail(url: string): Promise<{ html: string; text: string }> {
  const html = await render(<VerificationEmail url={url} />, { plainText: false });
  const text = await render(<VerificationEmail url={url} />, { plainText: true });
  return { html, text };
}
