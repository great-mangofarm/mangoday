"use client";

import { ApexChart } from "@/components/charts/ApexChart";

/** 공개 메인용 — 최근 6개월 공개 글/일지 발행 추이 (간단 영역 차트) */
export function ActivityChart({
  months,
  counts,
}: {
  months: string[];
  counts: number[];
}) {
  const labels = months.map((m) => `${Number(m.slice(5, 7))}월`);
  return (
    <ApexChart
      type="area"
      height={180}
      series={[{ name: "기록", data: counts }]}
      options={{
        chart: { toolbar: { show: false }, fontFamily: "inherit", sparkline: { enabled: false } },
        colors: ["#f59e0b"],
        xaxis: { categories: labels, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { formatter: (v) => `${Math.round(v)}` }, tickAmount: 3 },
        stroke: { curve: "smooth", width: 2 },
        fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
        dataLabels: { enabled: false },
        grid: { borderColor: "#f1f1f1", strokeDashArray: 4 },
        tooltip: { y: { formatter: (v) => `${v}개` } },
      }}
    />
  );
}
