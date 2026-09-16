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

export function PasswordResetEmail({
  url,
}: {
  url: string;
}) {
  return (
    <Html lang="pt">
      <Head />
      <Preview>Redefina a sua palavra-passe do SurfSync</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "24px 0", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, padding: 32 }}>
          <Heading as="h1" style={{ fontSize: 20, marginTop: 0 }}>
            Redefinir palavra-passe
          </Heading>
          <Text style={{ fontSize: 14, color: "#3f3f46", lineHeight: "20px" }}>
            Recebemos um pedido para redefinir a palavra-passe da sua conta
            SurfSync. O link é válido durante 1 hora e pode ser utilizado uma
            única vez.
          </Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={url}
              style={{ backgroundColor: "#0f172a", borderRadius: 8, color: "#ffffff", fontSize: 14, fontWeight: 600, padding: "12px 20px" }}
            >
              Redefinir palavra-passe
            </Button>
          </Section>
          <Text style={{ fontSize: 12, color: "#71717a", lineHeight: "18px" }}>
            Se o botão não funcionar, copie e cole este link no seu browser:
          </Text>
          <Link href={url} style={{ fontSize: 12, color: "#18181b", wordBreak: "break-all" }}>
            {url}
          </Link>
          <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#71717a", lineHeight: "18px" }}>
            Se não pediu a redefinição, ignore este email — a sua palavra-passe
            permanece inalterada. Por segurança, todas as sessões serão
            terminadas quando a palavra-passe for redefinida.
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
