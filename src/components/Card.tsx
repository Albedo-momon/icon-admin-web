import type { PropsWithChildren } from 'react'

type CardProps = PropsWithChildren<{ title?: string }>

export function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  )
}