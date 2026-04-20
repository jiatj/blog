type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  level?: "hero" | "section" | "page";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  level = "section"
}: SectionHeadingProps) {
  const titleClassName =
    level === "hero"
      ? "mt-4 text-[clamp(3.45rem,7.15vw,5.25rem)] font-semibold leading-[0.94] tracking-[-0.058em]"
      : level === "page"
        ? "mt-3 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl"
        : "mt-2 text-[1.55rem] font-semibold leading-[1.14] tracking-[-0.035em] sm:text-[1.8rem]";

  const descriptionClassName =
    level === "hero"
      ? "mt-5 max-w-[30rem] text-[1.03rem] leading-8 text-[var(--muted-foreground)] sm:text-[1.12rem] sm:leading-[2.04rem]"
      : "mt-3 max-w-xl text-[0.98rem] leading-7 text-[var(--muted-foreground)] sm:text-[1rem]";

  return (
    <div className={level === "hero" ? "max-w-[33rem]" : "max-w-2xl"}>
      {eyebrow ? (
        <p className="text-[0.66rem] uppercase tracking-[0.26em] text-[var(--muted-foreground-soft)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className={titleClassName}>{title}</h1>
      {description ? (
        <p className={descriptionClassName}>{description}</p>
      ) : null}
    </div>
  );
}
