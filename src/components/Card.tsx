import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type CardProps = PropsWithChildren<{ title?: string; className?: string }>

export function Card({ title, children, className }: CardProps) {
  return (
    <div className={cn(
      "rounded-lg border border-card-border bg-card text-card-foreground shadow-sm p-4",
      className
    )}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}