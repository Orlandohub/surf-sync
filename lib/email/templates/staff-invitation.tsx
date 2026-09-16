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

export function StaffInvitationEmail({
  schoolName,
  signupUrl,
}: {
  schoolName: string;
  signupUrl: string;
}) {
  return (
    <Html lang="pt">
      <Head />
      <Preview>Convite para gerir {schoolName} no SurfSync</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "24px 0", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, padding: 32 }}>
          <Heading as="h1" style={{ fontSize: 20, marginTop: 0 }}>
            Junte-se à equipa {schoolName}
          </Heading>
          <Text style={{ fontSize: 14, color: "#3f3f46", lineHeight: "20px" }}>
            Foi convidado para gerir a escola {schoolName} no SurfSync —
            procurar e reservar instrutores para as suas aulas. O convite é
            válido durante 7 dias.
          </Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={signupUrl}
              style={{ backgroundColor: "#0f172a", borderRadius: 8, color: "#ffffff", fontSize: 14, fontWeight: 600, padding: "12px 20px" }}
            >
              Criar conta
            </Button>
          </Section>
          <Text style={{ fontSize: 12, color: "#71717a", lineHeight: "18px" }}>
            Se o botão não funcionar, copie e cole este link no seu browser:
          </Text>
          <Link href={signupUrl} style={{ fontSize: 12, color: "#18181b", wordBreak: "break-all" }}>
            {signupUrl}
          </Link>
          <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#71717a", lineHeight: "18px" }}>
            Não estava à espera deste convite? Ignore este email em segurança.
            Ao criar conta com este endereço e escolher o tipo «Escola de
            Surf», ficará automaticamente ligado à escola.
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
