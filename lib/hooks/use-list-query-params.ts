'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Antes: cada página de listado (Productos, Clientes, Proveedores) traía la
 * tabla COMPLETA en cada carga (sin `.range()`/`.limit()`) y filtraba con
 * `.filter()` en el navegador. Esto no escala: con miles de SKUs, cada carga
 * de página transfiere y renderiza filas que el usuario nunca ve.
 *
 * Este hook centraliza el patrón de "búsqueda + paginación vía URL" (DRY):
 * - `q` y `page` viven en la URL (?q=...&page=2), así que la búsqueda/página
 *   sobrevive a un refresh y es compartible/bookmarkeable.
 * - El Server Component (page.tsx) lee `searchParams` y hace la consulta
 *   paginada/filtrada directamente en Postgres (`.range()`, `.ilike()`),
 *   en vez de traer todo y filtrar en el cliente.
 * - La búsqueda se debounce 350ms para no disparar una navegación por cada
 *   tecla presionada.
 */
export function useListQueryParams(debounceMs = 350) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialQ = searchParams.get('q') ?? ''
  const page = Number(searchParams.get('page') ?? '1') || 1

  const [searchInput, setSearchInput] = useState(initialQ)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Si la URL cambia por navegación externa (ej. botón "atrás"), sincroniza el input.
  useEffect(() => {
    setSearchInput(initialQ)
  }, [initialQ])

  const pushParams = useCallback(
    (next: { q?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.q !== undefined) {
        if (next.q) params.set('q', next.q)
        else params.delete('q')
      }
      if (next.page !== undefined) {
        if (next.page > 1) params.set('page', String(next.page))
        else params.delete('page')
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  const setSearch = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        pushParams({ q: value, page: 1 }) // toda búsqueda nueva reinicia a la página 1
      }, debounceMs)
    },
    [debounceMs, pushParams],
  )

  const setPage = useCallback(
    (nextPage: number) => {
      pushParams({ page: nextPage })
    },
    [pushParams],
  )

  return { searchInput, setSearch, page, setPage }
}
