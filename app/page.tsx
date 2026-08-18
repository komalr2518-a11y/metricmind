import MetricMindApp from "@/components/metricmind/app";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <MetricMindApp user={user} />;
}
