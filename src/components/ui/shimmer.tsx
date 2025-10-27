import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted',
        'shadow-sm border border-border/20',
        className
      )}
    />
  );
}

interface ShimmerSkeletonProps {
  className?: string;
}

export function ShimmerSkeleton({ className }: ShimmerSkeletonProps) {
  return (
    <div className={cn('min-h-screen bg-background p-6', className)}>
      {/* Header shimmer */}
      <div className="mb-8">
        <Shimmer className="h-8 w-48 mb-4" />
        <Shimmer className="h-4 w-96" />
      </div>

      {/* Navigation shimmer */}
      <div className="mb-8">
        <div className="flex space-x-4">
          <Shimmer className="h-10 w-24" />
          <Shimmer className="h-10 w-32" />
          <Shimmer className="h-10 w-28" />
          <Shimmer className="h-10 w-36" />
        </div>
      </div>

      {/* Content area shimmer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card/50 backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-lg border border-border/10">
            <Shimmer className="h-6 w-3/4" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-5/6" />
            <div className="flex space-x-2 pt-2">
              <Shimmer className="h-8 w-16" />
              <Shimmer className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Table shimmer */}
      <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/10">
        <div className="p-4 border-b border-border/10">
          <Shimmer className="h-6 w-32" />
        </div>
        <div className="divide-y divide-border/10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center space-x-4">
              <Shimmer className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-1/4" />
                <Shimmer className="h-3 w-1/2" />
              </div>
              <Shimmer className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AuthLoadingShimmerProps {
  className?: string;
}

export function AuthLoadingShimmer({ className }: AuthLoadingShimmerProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Top bar shimmer */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/20 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Shimmer className="h-8 w-32" />
          </div>
          <div className="flex items-center space-x-3">
            <Shimmer className="h-8 w-8 rounded-full" />
            <Shimmer className="h-6 w-24" />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar shimmer */}
        <div className="w-64 bg-card/60 backdrop-blur-sm border-r border-border/20 min-h-screen shadow-sm">
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 rounded-lg bg-card/30">
                <Shimmer className="h-5 w-5" />
                <Shimmer className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Main content shimmer */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <Shimmer className="h-8 w-48 mb-2" />
            <Shimmer className="h-4 w-96" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card/50 backdrop-blur-sm rounded-xl p-4 space-y-2 shadow-lg border border-border/10">
                <Shimmer className="h-4 w-20" />
                <Shimmer className="h-8 w-16" />
                <Shimmer className="h-3 w-24" />
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-lg border border-border/10">
            <Shimmer className="h-6 w-32 mb-4" />
            <Shimmer className="h-64 w-full" />
          </div>

          {/* Table */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/10">
            <div className="p-4 border-b border-border/10">
              <Shimmer className="h-6 w-40" />
            </div>
            <div className="divide-y divide-border/10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 grid grid-cols-5 gap-4 items-center">
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-8 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoginLoadingShimmerProps {
  className?: string;
}

export function LoginLoadingShimmer({ className }: LoginLoadingShimmerProps) {
  return (
    <div className={cn('min-h-screen flex items-center justify-center p-4 bg-[image:var(--gradient-auth-bg)]', className)}>
      <div className="w-full max-w-md">
        {/* Brand header shimmer */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card/80 backdrop-blur-sm mb-4 shadow-lg border border-border/20">
            <Shimmer className="w-8 h-8 rounded-md" />
          </div>
          <div className="space-y-2">
            <Shimmer className="h-6 w-40 mx-auto" />
            <Shimmer className="h-4 w-24 mx-auto" />
          </div>
        </div>

        {/* Card shimmer mimicking login form */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20">
          <div className="space-y-4">
            <div className="space-y-2">
              <Shimmer className="h-5 w-24" />
              <Shimmer className="h-11 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Shimmer className="h-5 w-24" />
              <Shimmer className="h-11 w-full rounded-md" />
            </div>
            <div>
              <Shimmer className="h-11 w-full rounded-md" />
            </div>
            <div className="text-center pt-2">
              <Shimmer className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}