import { Truck, ShieldCheck, RotateCcw, BadgeCheck } from "lucide-react";

const items = [
  { icon: Truck, title: "Free Delivery", subtitle: "On orders nationwide" },
  { icon: ShieldCheck, title: "Secure Payment", subtitle: "Trusted gateways" },
  { icon: RotateCcw, title: "Easy Returns", subtitle: "7-day return policy" },
  { icon: BadgeCheck, title: "Quality Assured", subtitle: "100% authentic" },
];

export default function TrustBadges() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ icon: Icon, title, subtitle }) => (
        <div
          key={title}
          className="flex flex-col items-center gap-2 rounded-xl bg-zinc-50 p-3 text-center ring-1 ring-zinc-100 sm:flex-row sm:items-start sm:gap-2.5 sm:text-left"
        >
          <Icon className="h-5 w-5 shrink-0 text-zinc-700" />
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight text-zinc-900 sm:text-sm">
              {title}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-zinc-500 sm:text-xs">
              {subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
