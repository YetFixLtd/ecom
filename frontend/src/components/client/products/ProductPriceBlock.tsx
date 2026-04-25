interface Props {
  price: number;
  comparePrice?: number | null;
}

export default function ProductPriceBlock({ price, comparePrice }: Props) {
  const hasDiscount = comparePrice != null && comparePrice > price;
  const savings = hasDiscount ? comparePrice! - price : 0;
  const percent = hasDiscount ? Math.round((savings / comparePrice!) * 100) : 0;

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-white p-5 ring-1 ring-zinc-100">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-4xl font-bold tracking-tight text-zinc-900">
          ৳{price.toFixed(2)}
        </span>
        {hasDiscount && (
          <span className="text-xl text-zinc-400 line-through">
            ৳{comparePrice!.toFixed(2)}
          </span>
        )}
        {hasDiscount && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
            -{percent}%
          </span>
        )}
      </div>
      {hasDiscount && (
        <p className="mt-2 text-sm font-medium text-emerald-700">
          You save ৳{savings.toFixed(2)}
        </p>
      )}
    </div>
  );
}
