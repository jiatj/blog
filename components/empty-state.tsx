export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--border-soft)] bg-[color:color-mix(in_srgb,var(--surface)_84%,transparent)] p-10 text-center text-[var(--muted-foreground)]">
      {message}
    </div>
  );
}
