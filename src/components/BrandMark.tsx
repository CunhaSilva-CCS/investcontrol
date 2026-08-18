import Image from "next/image";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/investe-valor-icon.png"
      alt=""
      width={32}
      height={32}
      className={className}
      aria-hidden="true"
    />
  );
}
