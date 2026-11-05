// Funciones para trabajar con fechas y periodos (Reportes, datos de ejemplo)

/** Fecha de hace `dias` días a la hora indicada, en formato ISO. Sirve para los datos de ejemplo. */
export function haceDias(dias, hora = 10, minutos = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(hora, minutos, 0, 0);
  return fecha.toISOString();
}

/** "2026-11-04" → Date al inicio (00:00) o al final (23:59) de ese día, en hora local. */
function desdeTextoFecha(texto, finDelDia = false) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return finDelDia ? new Date(anio, mes - 1, dia, 23, 59, 59, 999) : new Date(anio, mes - 1, dia);
}

/** Date → "2026-11-04" (para los campos de tipo fecha) */
export function aTextoFecha(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * Regresa { inicio, fin } (objetos Date) para un periodo:
 *   'mes' (este mes), 'mes-anterior', 'anio' (este año) o 'personalizado' (usa desde / hasta).
 * Regresa null si el periodo personalizado no tiene fechas válidas.
 */
export function rangoDelPeriodo(periodo, desde, hasta, hoy = new Date()) {
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const finDeHoy = new Date(anio, mes, hoy.getDate(), 23, 59, 59, 999);

  if (periodo === 'mes') return { inicio: new Date(anio, mes, 1), fin: finDeHoy };
  if (periodo === 'mes-anterior') {
    return { inicio: new Date(anio, mes - 1, 1), fin: new Date(anio, mes, 0, 23, 59, 59, 999) };
  }
  if (periodo === 'anio') return { inicio: new Date(anio, 0, 1), fin: finDeHoy };

  if (!desde || !hasta) return null;
  const inicio = desdeTextoFecha(desde);
  const fin = desdeTextoFecha(hasta, true);
  return inicio <= fin ? { inicio, fin } : null;
}

/** ¿La fecha (texto ISO) cae dentro del rango? */
export function estaEnRango(fecha, rango) {
  const f = new Date(fecha);
  return f >= rango.inicio && f <= rango.fin;
}
