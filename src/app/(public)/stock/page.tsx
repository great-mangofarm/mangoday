import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "주식일지" };

export default function StockPage() {
  return <ComingSoon title="주식일지" phase="Phase 5" />;
}
