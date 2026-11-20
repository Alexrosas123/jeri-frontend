/*
  Descuentos y promociones por cliente y por producto.

  Una promoción da un % de descuento y puede aplicar a:
    - un cliente (todos sus productos),
    - un producto (para todos los clientes),
    - un cliente Y un producto (precio especial),
    - o a todos (descuento general).
  Solo cuenta si está activa y la fecha de hoy está dentro de su vigencia.
  Si a una venta le aplican varias, se usa la de MAYOR descuento.

  Rutas del back-end por confirmar con el equipo:
    GET/POST  /api/promotions     PUT /api/promotions/{id}
    Campos: { nombre, clienteId|null, productoId|null, porcentaje, desde, hasta, activa }
*/
import { API_URL, esperar, pedir, usaEjemplo } from './api';
import { aTextoFecha } from '../utils/fechas';

export { usaEjemplo };

/** "2026-11-20" de hoy + n días (para que los ejemplos siempre estén vigentes) */
function diaRelativo(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return aTextoFecha(fecha);
}

let promociones = [
  { id: 1, nombre: 'Guantes de temporada', clienteId: null, productoId: 3, porcentaje: 10, desde: diaRelativo(-15), hasta: diaRelativo(15), activa: true },
  { id: 2, nombre: 'Cliente frecuente A', clienteId: 1, productoId: null, porcentaje: 5, desde: diaRelativo(-60), hasta: diaRelativo(60), activa: true },
  { id: 3, nombre: 'Precio especial termómetros', clienteId: 2, productoId: 7, porcentaje: 15, desde: diaRelativo(-10), hasta: diaRelativo(20), activa: true },
  { id: 4, nombre: 'Liquidación cubrebocas', clienteId: null, productoId: 4, porcentaje: 20, desde: diaRelativo(-60), hasta: diaRelativo(-30), activa: true },
  { id: 5, nombre: 'Buen Fin', clienteId: null, productoId: null, porcentaje: 8, desde: diaRelativo(10), hasta: diaRelativo(14), activa: true },
];

/** 'vigente' | 'programada' | 'vencida' | 'pausada' */
export function estadoPromocion(promocion, hoy = aTextoFecha(new Date())) {
  if (!promocion.activa) return 'pausada';
  if (hoy < promocion.desde) return 'programada';
  if (hoy > promocion.hasta) return 'vencida';
  return 'vigente';
}

/**
 * La promoción con mayor descuento que aplica a este cliente y producto hoy.
 * Regresa la promoción o null si no aplica ninguna.
 */
export function mejorPromocion(lista, clienteId, productoId, hoy = aTextoFecha(new Date())) {
  return lista
    .filter((p) => estadoPromocion(p, hoy) === 'vigente')
    .filter((p) => (p.clienteId == null || p.clienteId === clienteId) && (p.productoId == null || p.productoId === productoId))
    .reduce((mejor, p) => (!mejor || p.porcentaje > mejor.porcentaje ? p : mejor), null);
}

/** Precio con descuento, redondeado a centavos */
export function aplicarDescuento(precio, porcentaje) {
  return Math.round(precio * (1 - porcentaje / 100) * 100) / 100;
}

export async function listarPromociones() {
  if (!API_URL) {
    await esperar(300);
    return [...promociones];
  }
  return pedir('/api/promotions');
}

export async function crearPromocion(datos) {
  if (!API_URL) {
    await esperar(300);
    const nueva = { ...datos, id: Date.now() };
    promociones = [nueva, ...promociones];
    return nueva;
  }
  return pedir('/api/promotions', { method: 'POST', body: JSON.stringify(datos) });
}

export async function actualizarPromocion(id, datos) {
  if (!API_URL) {
    await esperar(300);
    const actualizada = { ...datos, id };
    promociones = promociones.map((p) => (p.id === id ? actualizada : p));
    return actualizada;
  }
  return pedir(`/api/promotions/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
}
