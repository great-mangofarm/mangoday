export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted">준비 중입니다. ({phase})</p>
    </div>
  );
}
