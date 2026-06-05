import { requireAdmin } from "@/lib/auth/dal";
import {
  buildMonthGrid,
  todayKst,
  getAllEvents,
  getCompletions,
} from "@/lib/calendar";
import { AdminCalendar } from "@/components/calendar/AdminCalendar";

const YM_RE = /^\d{4}-\d{2}$/;

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  await requireAdmin();
  const { ym } = await searchParams;
  const month = ym && YM_RE.test(ym) ? ym : todayKst().slice(0, 7);
  const grid = buildMonthGrid(month);
  const [events, completionKeys] = await Promise.all([
    getAllEvents(),
    getCompletions(grid.weeks[0][0], grid.weeks[5][6]),
  ]);

  return (
    <AdminCalendar
      ym={month}
      events={events}
      completionKeys={completionKeys}
      today={todayKst()}
    />
  );
}
