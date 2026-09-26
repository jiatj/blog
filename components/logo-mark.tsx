import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/site-config";

export function LogoMark({ locale }: { locale: Locale }) {
  return (
    <Link aria-label="AI Builder Lab home" className="inline-flex items-center gap-3" href={`/${locale}`}>
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#0f0f12]">
        <Image alt="" className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" height={76} priority src="/brand/abl-icon.png" width={76} />
      </span>
      <span className="flex flex-col leading-tight">
        <strong className="text-[0.92rem] font-semibold tracking-[-0.035em] sm:text-[1.03rem]">AI Builder Lab</strong>
        <span className="mt-0.5 text-[0.63rem] font-medium tracking-[0.12em] text-[var(--muted-foreground-soft)]">BUILD · THINK · SHIP</span>
      </span>
    </Link>
  );
}
