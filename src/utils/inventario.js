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
