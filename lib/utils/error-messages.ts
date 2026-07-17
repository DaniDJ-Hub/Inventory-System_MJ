import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Antes: cada `catch` mostraba un toast genérico ("Error al guardar producto") y
 * silenciaba el error real en `console.error`. Esto oculta información accionable
 * al usuario (ej. "el SKU ya existe" vs. un error de red) y dificulta el soporte.
 *
 * Ahora: mapeamos los códigos de error de Postgres/PostgREST más comunes a mensajes
 * claros en español. Códigos de referencia:
 *   23505 -> unique_violation
 *   23503 -> foreign_key_violation
 *   23502 -> not_null_violation
 *   42501 -> insufficient_privilege (RLS bloqueó la operación)
 */
export function getFriendlyErrorMessage(error: PostgrestError | null, fallback: string): string {
  if (!error) return fallback

  switch (error.code) {
    case '23505':
      return 'Ya existe un registro con ese valor único (por ejemplo, el SKU o correo ya está en uso).'
    case '23503':
      return 'No se puede completar la operación porque este registro está relacionado con otros datos (ventas, compras, etc.).'
    case '23502':
      return 'Falta un campo obligatorio.'
    case '42501':
      return 'No tienes permisos para realizar esta acción.'
    case 'PGRST116':
      return 'El registro no fue encontrado.'
    default:
      return fallback
  }
}
