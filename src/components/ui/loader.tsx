import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Loader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 text-sm font-medium text-muted-foreground',
        className,
      )}
    >
      <LoaderCircle className="size-5 animate-spin text-primary" />
      Loading…
    </div>
  )
}