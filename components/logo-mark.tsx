import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/site-config";

export function LogoMark({ locale }: { locale: Locale }) {
  return (
    <Link aria-label="AI Builder Lab home" className="inline-flex shrink-0 items-center" href={`/${locale}`}>
      <Image
        alt="AI Builder Lab"
        className="brand-wordmark block h-14 w-40 object-contain"
        height={56}
        priority
        src="/brand/abl-wordmark.png"
        width={160}
      />
    </Link>
  );
}
