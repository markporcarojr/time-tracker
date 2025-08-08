export function SummaryCard({
  label,
  minutes,
}: {
  label: string;
  minutes: number;
}) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return (
    <div className="bg-white shadow rounded p-4 text-center border">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-bold">
        {hrs}h {mins}m
      </div>
    </div>
  );
}
