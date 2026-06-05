"use client";

import type { ApexOptions } from "apexcharts";
import { ApexChart } from "@/components/charts/ApexChart";
import type { AdminDashboard } from "@/lib/dashboard";

const AMBER = "#f59e0b";
const GREEN = "#22c55e";

function monthLabels(months: string[]): string[] {
  return months.map((m) => `${Number(m.slice(5, 7))}월`);
}

const baseChart: ApexOptions["chart"] = {
  toolbar: { show: false },
  fontFamily: "inherit",
  animations: { speed: 400 },
};

export function DashboardCharts({ data }: { data: AdminDashboard }) {
  const labels = monthLabels(data.months);
  const ratePct =
    data.habit.rate == null ? 0 : Math.round(data.habit.rate * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="전체 글" value={`${data.totals.posts}개`} />
        <Stat label="발행" value={`${data.totals.published}개`} />
        <Stat label="할일 일정" value={`${data.totals.tasks}개`} />
        <Stat
          label="이번 달 수행률"
          value={
            data.habit.rate == null
              ? "—"
              : `${ratePct}% (${data.habit.done}/${data.habit.expected})`
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="글 종류별 분포">
          <ApexChart
            type="donut"
            height={260}
            series={[
              data.postsByKind.blog,
              data.postsByKind.stock,
              data.postsByKind.workout,
            ]}
            options={{
              chart: baseChart,
              labels: ["블로그", "주식", "운동"],
              colors: [AMBER, "#ef4444", GREEN],
              legend: { position: "bottom" },
              dataLabels: { enabled: true },
              stroke: { width: 0 },
            }}
          />
        </Card>

        <Card title="이번 달 습관 수행률">
          <ApexChart
            type="radialBar"
            height={260}
            series={[ratePct]}
            options={{
              chart: baseChart,
              colors: [AMBER],
              plotOptions: {
                radialBar: {
                  hollow: { size: "60%" },
                  dataLabels: {
                    name: { offsetY: 20, color: "#71717a", fontSize: "13px" },
                    value: { offsetY: -16, fontSize: "28px", fontWeight: 700 },
                  },
                },
              },
              labels: [`${data.habit.done}/${data.habit.expected} 완료`],
            }}
          />
        </Card>

        <Card title="월별 발행 추이">
          <ApexChart
            type="bar"
            height={260}
            series={[{ name: "발행", data: data.postsPerMonth }]}
            options={{
              chart: baseChart,
              colors: [AMBER],
              xaxis: { categories: labels },
              plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
              dataLabels: { enabled: false },
              grid: { borderColor: "#f1f1f1" },
            }}
          />
        </Card>

        <Card title="주식 실현손익 추이 (원)">
          <ApexChart
            type="bar"
            height={260}
            series={[{ name: "손익", data: data.stockPnlPerMonth }]}
            options={{
              chart: baseChart,
              xaxis: { categories: labels },
              plotOptions: {
                bar: {
                  borderRadius: 4,
                  columnWidth: "55%",
                  colors: {
                    ranges: [
                      { from: -1e15, to: -0.01, color: "#3b82f6" },
                      { from: 0.01, to: 1e15, color: "#ef4444" },
                    ],
                  },
                },
              },
              dataLabels: { enabled: false },
              yaxis: {
                labels: {
                  formatter: (v) => `${Math.round(v).toLocaleString("ko-KR")}`,
                },
              },
              grid: { borderColor: "#f1f1f1" },
            }}
          />
        </Card>

        <Card title="운동 볼륨 추이 (kg)">
          <ApexChart
            type="area"
            height={260}
            series={[{ name: "볼륨", data: data.workoutVolumePerMonth }]}
            options={{
              chart: baseChart,
              colors: [GREEN],
              xaxis: { categories: labels },
              stroke: { curve: "smooth", width: 2 },
              fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
              dataLabels: { enabled: false },
              yaxis: {
                labels: {
                  formatter: (v) => `${Math.round(v).toLocaleString("ko-KR")}`,
                },
              },
              grid: { borderColor: "#f1f1f1" },
            }}
          />
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-base font-bold">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}
