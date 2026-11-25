import clsx from "clsx";

/**
 * The Signal wordmark: lowercase "signal" with a brand-blue full stop,
 * echoing the "product signal." headline. No icon tile.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-baseline text-[19px] font-semibold leading-none tracking-[-0.045em] text-ink", className)}>
      signal
      <span aria-hidden className="ml-[1px] inline-block size-[5px] translate-y-[-0.5px] rounded-full bg-brand dark:bg-brandsky" />
    </span>
  );
}
