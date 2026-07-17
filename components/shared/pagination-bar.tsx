'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface PaginationBarProps {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
}

/**
 * Controles de paginación reutilizables (Productos, Clientes, Proveedores).
 * Construido sobre `components/ui/pagination.tsx` (shadcn) que ya estaba
 * instalado pero sin usarse en ningún lado del proyecto.
 */
export function PaginationBar({ page, pageSize, totalCount, onPageChange }: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  if (totalPages <= 1) return null

  const pageNumbers = getPageWindow(page, totalPages)

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {Math.min((page - 1) * pageSize + 1, totalCount)}–
        {Math.min(page * pageSize, totalCount)} de {totalCount}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={page <= 1}
              className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
              onClick={(e) => {
                e.preventDefault()
                if (page > 1) onPageChange(page - 1)
              }}
            />
          </PaginationItem>

          {pageNumbers.map((p, idx) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(p)
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? 'pointer-events-none opacity-40' : ''}
              onClick={(e) => {
                e.preventDefault()
                if (page < totalPages) onPageChange(page + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function getPageWindow(current: number, total: number): Array<number | 'ellipsis'> {
  const window = 1
  const pages: Array<number | 'ellipsis'> = []
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - window && p <= current + window)) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }
  return pages
}
