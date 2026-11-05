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

const FECHA = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' });

/** "2026-10-20T10:15:00" → "20 oct 2026" */
export function formatearFecha(fecha) {
  return FECHA.format(new Date(fecha));
}

/** 7 → "COM-0007" */
export function crearFolio(prefijo, numero) {
  return `${prefijo}-${String(numero).padStart(4, '0')}`;
}

/** Suma cantidad × precio de cada línea de una compra, venta o cotización. */
export function totalDeLineas(lineas) {
  return lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0);
}
