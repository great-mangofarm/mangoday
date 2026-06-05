import type { Metadata } from "next";
import { getPublishedJournal, computeStockStats } from "@/lib/journal";
import { JournalCard } from "@/components/journal/JournalCard";
import { formatPnl } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "주식 일지",
  description: "mangoday의 주식 매매 일지와 실현 손익 기록",
};

export default async function StockPage() {
  const items = await getPublishedJournal("stock");
  const stats = computeStockStats(items);
  const pnlColor =
    stats.totalPnl > 0
      ? "text-red-600"
      : stats.totalPnl < 0
        ? "text-blue-600"
        : "text-foreground";

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">주식 일지</h1>
        <p className="mt-1 text-muted">매매 기록과 실현 손익</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="총 실현손익" value={formatPnl(stats.totalPnl)} valueClass={pnlColor} />
        <Stat label="이번 달" value={formatPnl(stats.monthPnl)} />
        <Stat
          label="승률"
          value={stats.winRate == null ? "—" : `${Math.round(stats.winRate * 100)}%`}
        />
        <Stat label="기록" value={`${stats.count}개`} />
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          아직 공개된 주식 일지가 없어요.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <JournalCard key={item.id} kind="stock" item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-foreground",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}
