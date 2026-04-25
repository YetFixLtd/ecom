export default function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="aspect-square animate-pulse rounded-2xl bg-zinc-200" />
          <div className="mt-4 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-zinc-200" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-200" />
          <div className="h-16 animate-pulse rounded-xl bg-zinc-200" />
          <div className="flex gap-3">
            <div className="h-12 flex-1 animate-pulse rounded-xl bg-zinc-200" />
            <div className="h-12 flex-1 animate-pulse rounded-xl bg-zinc-200" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
