// Funciones para mostrar números con el formato de México

const PESOS = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** 48250 → "$48,250.00" */
export function formatearPesos(cantidad) {
  return PESOS.format(cantidad ?? 0);
}
