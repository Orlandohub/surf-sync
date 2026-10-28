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

export function PasswordResetEmail({
  url,
}: {
  url: string;
}) {
  return (
    <Html lang="pt-PT">
      <Head />
      <Preview>O link é válido durante 1 hora.</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "24px 0", backgroundColor: canvas }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 16, padding: 32 }}>
          <Lockup />
          <Heading as="h1" style={{ fontSize: 20, lineHeight: "28px", marginTop: 0, color: ink }}>
            Redefine a tua palavra-passe
          </Heading>
          <Text style={{ fontSize: 15, lineHeight: "22px", color: muted }}>
            Recebemos um pedido para redefinir a palavra-passe da tua conta no
            surfsync. O link é válido durante 1 hora e só pode ser usado uma vez.
          </Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={url}
              style={{ backgroundColor: teal, borderRadius: 12, color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "12px 20px" }}
            >
              Redefinir palavra-passe
            </Button>
          </Section>
          <Text style={{ fontSize: 13, lineHeight: "18px", color: muted }}>
            Se o botão não funcionar, copia este link para o navegador:
          </Text>
          <Link href={url} style={{ fontSize: 13, color: teal, wordBreak: "break-all" }}>
            {url}
          </Link>
          <Hr style={{ borderColor: hairline, margin: "24px 0" }} />
          <Text style={{ fontSize: 12, lineHeight: "16px", color: faint }}>
            Não pediste para redefinir a palavra-passe? Podes ignorar este email:
            a tua palavra-passe não muda. Quando a redefinires, terminamos a
            sessão em todos os dispositivos.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderPasswordResetEmail(url: string): Promise<{ html: string; text: string }> {
  const html = await render(<PasswordResetEmail url={url} />, { plainText: false });
  const text = await render(<PasswordResetEmail url={url} />, { plainText: true });
  return { html, text };
}
