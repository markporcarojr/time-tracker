export default function Meta({
  icon,
  children,
  title,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      title={title}
    >
      <span className="opacity-70">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}
