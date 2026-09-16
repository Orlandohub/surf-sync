import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = {
  title: "Criar conta",
};

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <SignUpForm />
    </main>
  );
}
