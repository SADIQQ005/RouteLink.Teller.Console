import { Construction } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'

export function ComingSoonPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-xl border bg-card px-6 py-14 text-center shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Construction className="size-7" />
        </div>
        <Badge
          variant="outline"
          className="mt-5 border-panel-lavender-ink/20 bg-panel-lavender-soft text-panel-lavender-ink"
        >
          Coming soon
        </Badge>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          This module is on the roadmap and will be available in a future
          release.
        </p>
      </div>
    </div>
  )
}