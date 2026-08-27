import type { ReactNode } from 'react'

import { Separator } from '@/components/ui/separator'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-in-up">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold tracking-tight sm:text-[30px] text-balance leading-[1.15]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground text-balance max-w-xl">
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function TableSectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <Separator className="h-px flex-1" />
    </div>
  )
}
