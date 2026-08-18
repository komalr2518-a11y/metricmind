import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Register — MetricMind",
  description: "Create a local MetricMind account.",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return <AuthForm mode="register" />;
}
