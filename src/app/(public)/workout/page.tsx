import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = { title: "운동일지" };

export default function WorkoutPage() {
  return <ComingSoon title="운동일지" phase="Phase 5" />;
}
