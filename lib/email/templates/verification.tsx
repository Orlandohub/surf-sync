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

export function VerificationEmail({
  url,
}: {
  url: string;
}) {
  return (
    <Html lang="pt">
      <Head />
      <Preview>Verifique o seu email para continuar no SurfSync</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "24px 0", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, padding: 32 }}>
          <Heading as="h1" style={{ fontSize: 20, marginTop: 0 }}>
            Confirme o seu email
          </Heading>
          <Text style={{ fontSize: 14, color: "#3f3f46" }}>
            Bem-vindo ao SurfSync! Clique no botão abaixo para verificar o seu
            endereço de email. O link é válido durante 24 horas e pode ser
            utilizado uma única vez.
          </Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Button
              href={url}
              style={{ backgroundColor: "#18181b", color: "#ffffff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14 }}
            >
              Verificar email
            </Button>
          </Section>
          <Text style={{ fontSize: 12, color: "#71717a" }}>
            Se não conseguir clicar no botão, copie e cole este link no seu
            navegador:{" "}
            <Link href={url} style={{ color: "#18181b", wordBreak: "break-all" }}>
              {url}
            </Link>
          </Text>
          <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#a1a1aa" }}>
            Se não criou uma conta no SurfSync, pode ignorar este email em
            segurança.
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
