import Link from "next/link";

type ContactEntryCardProps = {
  name: string;
  hint: string;
  cta: string;
  href: string;
  qrSrc: string;
};

export function ContactEntryCard({ name, hint, cta, href, qrSrc }: ContactEntryCardProps) {
  return (
    <article className="rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border-soft)_96%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_58%,transparent)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[1rem] font-semibold leading-6 text-[var(--foreground)]">{name}</p>
          <p className="mt-1 text-[0.82rem] leading-6 text-[var(--muted-foreground)]">{hint}</p>
        </div>
        <img
          alt={`${name} QR code`}
          className="h-20 w-20 rounded-[0.9rem] border border-[color:color-mix(in_srgb,var(--border-faint)_96%,transparent)] bg-white object-cover p-1"
          height={80}
          src={qrSrc}
          width={80}
        />
      </div>
      <Link
        className="mt-4 inline-flex items-center border-b border-[var(--link-underline)] pb-0.5 text-[0.84rem] font-medium text-[var(--foreground)] transition hover:border-[var(--link-underline-hover)] hover:text-[var(--accent-ink)]"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {cta} {"->"}
      </Link>
    </article>
  );
}
