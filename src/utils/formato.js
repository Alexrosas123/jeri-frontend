// Funciones para mostrar números con el formato de México

const PESOS = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** 48250 → "$48,250.00" */
export function formatearPesos(cantidad) {
  return PESOS.format(cantidad ?? 0);
}

const FECHA_HORA = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

/** "2026-10-20T10:15:00" → "20 oct 2026, 10:15" */
export function formatearFechaHora(fecha) {
  return FECHA_HORA.format(new Date(fecha));
}
