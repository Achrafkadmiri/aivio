import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Real brand marks, provided directly (not fetched) for these 5 providers.
 * Everything else falls back to a monogram badge below. */
const REAL_LOGOS: Record<string, { viewBox: string; content: ReactNode; padded?: boolean }> = {
  ByteDance: {
    viewBox: "0 0 24 24",
    content: (
      <>
        <path fill="#00C8D2" d="M14.944 18.587l-1.704-.445V10.01l1.824-.462c1-.254 1.84-.461 1.88-.453.032 0 .056 2.235.056 4.972v4.973l-.176-.008c-.104 0-.952-.207-1.88-.446z" />
        <path fill="#3C8CFF" d="M7 16.542c0-2.736.024-4.98.064-4.98.032-.008.872.2 1.88.454l1.816.461-.016 4.05-.024 4.049-1.632.422c-.896.23-1.736.445-1.856.469L7 21.523v-4.98z" />
        <path fill="#78E6DC" d="M19.24 12.477c0-9.03.008-9.515.144-9.475.072.024.784.207 1.576.406.792.207 1.576.405 1.744.445l.296.08-.016 8.56-.024 8.568-1.624.414c-.888.23-1.728.437-1.856.47l-.24.055v-9.523z" />
        <path fill="#325AB4" d="M1 12.509c0-4.678.024-8.505.064-8.505.032 0 .872.207 1.872.454l1.824.461v7.582c0 4.16-.016 7.574-.032 7.574-.024 0-.872.215-1.88.47L1 21.013v-8.505z" />
      </>
    ),
  },
  "Black Forest Labs": {
    viewBox: "0 0 24 24",
    content: (
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M17.113 10.248H14.56l-2.553-3.616-7.963 11.27h2.558l5.405-7.654h2.552l-5.404 7.653h2.565l5.392-7.653L24 20 19.97 20v-2.091l-2.857-4.044-2.842 4.037V20H0L12.008 3l5.105 7.249z"
      />
    ),
    padded: false,
  },
  xAI: {
    viewBox: "0 0 24 24",
    content: (
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815"
      />
    ),
  },
  Google: {
    viewBox: "0 0 32 32",
    content: (
      <>
        <path fill="#00ac47" d="M23.75,16A7.7446,7.7446,0,0,1,8.7177,18.6259L4.2849,22.1721A13.244,13.244,0,0,0,29.25,16" />
        <path fill="#4285f4" d="M23.75,16a7.7387,7.7387,0,0,1-3.2516,6.2987l4.3824,3.5059A13.2042,13.2042,0,0,0,29.25,16" />
        <path fill="#ffba00" d="M8.25,16a7.698,7.698,0,0,1,.4677-2.6259L4.2849,9.8279a13.177,13.177,0,0,0,0,12.3442l4.4328-3.5462A7.698,7.698,0,0,1,8.25,16Z" />
        <path fill="#ea4435" d="M16,8.25a7.699,7.699,0,0,1,4.558,1.4958l4.06-3.7893A13.2152,13.2152,0,0,0,4.2849,9.8279l4.4328,3.5462A7.756,7.756,0,0,1,16,8.25Z" />
        <path fill="#4285f4" d="M29.25,15v1L27,19.5H16.5V14H28.25A1,1,0,0,1,29.25,15Z" />
      </>
    ),
  },
  Alibaba: {
    viewBox: "0 0 24 24",
    content: (
      <path
        fillRule="evenodd"
        fill="#FF6003"
        d="M24 14.014c-2.8 1.512-5.62 2.896-8.759 3.524-.7.139-1.476.139-2.187.043-.678-.085-1.017-.682-.776-1.31.23-.585.536-1.181.93-1.671.852-1.065 1.814-2.034 2.678-3.088a15.75 15.75 0 001.422-2.054c.306-.511.164-1.129-.372-1.384-.897-.437-1.859-.745-2.81-1.075-.11-.043-.274.074-.492.149.273.244.47.425.743.67-2.821.48-5.49 1.16-8.08 2.098-.012.053-.033.095-.023.117.383.585.208 1.032-.35 1.394a2.365 2.365 0 00-.568.522c1.706.5 3.226.213 4.68-.735-.087-.127-.175-.244-.262-.372.546.096.874.394.918.862.011.107-.054.213-.087.32-.077-.086-.175-.17-.24-.267-.045-.064-.056-.138-.088-.245-1.728 1.15-3.587 1.438-5.632.842 0 .404-.022.745.011 1.075.022.287-.098.415-.36.564-.591.362-1.204.735-1.696 1.214-.59.585-.371 1.299.427 1.597.907.34 1.859.35 2.81.234 1.126-.139 2.23-.32 3.456-.49-1.433.67-2.844 1.14-4.33 1.33-1.04.14-2.078.214-3.106-.084-1.476-.415-2.133-1.501-1.75-2.96.361-1.363 1.236-2.449 2.176-3.45 3.139-3.332 7.108-5.024 11.7-5.365 1.072-.074 2.155.064 3.16.511 1.411.639 2.002 1.99 1.313 3.354-.448.905-1.072 1.735-1.695 2.555-.612.809-1.301 1.554-1.946 2.331-.186.234-.361.48-.503.745-.274.5-.088.83.492.778 1.213-.118 2.45-.213 3.62-.511 1.716-.437 3.389-1.054 5.084-1.597.175-.043.339-.107.492-.17z"
      />
    ),
  },
};

const MONOGRAM_STYLES: Record<string, { initials: string; className: string }> = {
  "Stability AI (Cloudflare)": { initials: "SA", className: "bg-[#6366F1]/15 text-[#6366F1]" },
  Leonardo: { initials: "LE", className: "bg-[#8B5CF6]/15 text-[#8B5CF6]" },
  Recraft: { initials: "RC", className: "bg-[#F43F5E]/15 text-[#F43F5E]" },
};

const FALLBACK_CLASSES = [
  "bg-[#7C3AED]/15 text-[#a78bfa]",
  "bg-[#3B82F6]/15 text-[#60a5fa]",
  "bg-[#F59E0B]/15 text-[#fbbf24]",
  "bg-[#EF4444]/15 text-[#f87171]",
];

function fallbackFor(provider: string) {
  let hash = 0;
  for (let i = 0; i < provider.length; i++) hash = (hash * 31 + provider.charCodeAt(i)) >>> 0;
  const initials = provider
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return { initials: initials || "?", className: FALLBACK_CLASSES[hash % FALLBACK_CLASSES.length] };
}

const sizeClasses = { sm: "size-5", md: "size-7" } as const;
const iconInsetClasses = { sm: "size-3.5", md: "size-5" } as const;
const textSizeClasses = { sm: "text-[9px]", md: "text-[10px]" } as const;

export function ProviderLogo({
  provider,
  size = "md",
  className,
}: {
  provider: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const real = REAL_LOGOS[provider];
  if (real) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-white/95",
          sizeClasses[size],
          className,
        )}
        aria-hidden="true"
      >
        <svg viewBox={real.viewBox} className={cn(iconInsetClasses[size], "text-black")}>
          {real.content}
        </svg>
      </span>
    );
  }

  const style = MONOGRAM_STYLES[provider] ?? fallbackFor(provider);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        sizeClasses[size],
        textSizeClasses[size],
        style.className,
        className,
      )}
      aria-hidden="true"
    >
      {style.initials}
    </span>
  );
}
