import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in — MetricMind",
  description: "Sign in to your MetricMind workspace.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return <AuthForm mode="login" />;
}
