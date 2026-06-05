import { requireAdmin } from "@/lib/auth/dal";
import { getAdminDashboard } from "@/lib/dashboard";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { PushControls } from "@/components/pwa/PushControls";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const data = await getAdminDashboard();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <PushControls />
      <DashboardCharts data={data} />
    </section>
  );
}
