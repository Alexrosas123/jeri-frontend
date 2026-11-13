/**
 * Estado de existencia de un producto (RF-17):
 *   - Agotado: existencia 0
 *   - Stock bajo: existencia por debajo del stock mínimo
 *   - Disponible: en cualquier otro caso
 * Regresa { tipo, texto } listo para usarse en <Badge>.
 */
export function estadoExistencia({ existencia, stockMinimo }) {
  if (existencia <= 0) return { tipo: 'error', texto: 'Agotado' };
  if (existencia < stockMinimo) return { tipo: 'alerta', texto: 'Stock bajo' };
  return { tipo: 'ok', texto: 'Disponible' };
}

/** El producto se muestra en listas (no fue eliminado) */
export function estaVisible(producto) {
  return !producto.eliminado;
}

/** El producto se puede comprar, vender o cotizar (no está inhabilitado ni eliminado) */
export function estaDisponible(producto) {
  return !producto.eliminado && producto.activo !== false;
}

/** Estado para mostrar en listas: "Inhabilitado" o el estado de existencia */
export function estadoProducto(producto) {
  if (producto.activo === false) return { tipo: 'neutro', texto: 'Inhabilitado' };
  return estadoExistencia(producto);
}
