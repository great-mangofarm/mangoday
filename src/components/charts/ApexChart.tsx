"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

// ApexCharts 는 window 의존 → SSR 비활성 동적 로드
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-lg bg-surface" />,
});

export type ChartSeries =
  | number[]
  | Array<{ name?: string; data: (number | null)[] }>;

export function ApexChart({
  type,
  series,
  options,
  height = 260,
}: {
  type:
    | "line"
    | "area"
    | "bar"
    | "donut"
    | "pie"
    | "radialBar";
  series: ChartSeries;
  options: ApexOptions;
  height?: number;
}) {
  return (
    <ReactApexChart type={type} series={series} options={options} height={height} />
  );
}
