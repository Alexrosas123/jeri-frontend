/*
  Cotizaciones (RF-16).

  Una cotización NO mueve el inventario. Puede estar pendiente, aceptada, rechazada
  o convertida en venta. Si pasa su vigencia y sigue pendiente, se muestra como "vencida".

  Rutas del back-end por confirmar con el equipo:
    GET/POST  /api/quotes                (POST: { clienteId, vigenciaDias, lineas: [{ productoId, cantidad, precio }] })
    PUT       /api/quotes/{id}/status    ({ estado: 'aceptada' | 'rechazada' })
  La conversión a venta la hace services/ventas.js (registrarVenta con cotizacionId).
*/
import { API_URL, esperar, pedir, usaEjemplo } from './api';
import { haceDias } from '../utils/fechas';
import { crearFolio, totalDeLineas } from '../utils/formato';

export { usaEjemplo };

let cotizaciones = [
  { id: 1, folio: 'COT-0001', clienteId: 1, fecha: haceDias(3), vigenciaDias: 15, estado: 'pendiente', lineas: [{ productoId: 1, cantidad: 10, precio: 45 }, { productoId: 2, cantidad: 6, precio: 38.5 }] },
  { id: 2, folio: 'COT-0002', clienteId: 2, fecha: haceDias(5), vigenciaDias: 15, estado: 'aceptada', lineas: [{ productoId: 7, cantidad: 2, precio: 160 }, { productoId: 6, cantidad: 3, precio: 120 }] },
  { id: 3, folio: 'COT-0003', clienteId: 3, fecha: haceDias(1), vigenciaDias: 7, estado: 'pendiente', lineas: [{ productoId: 8, cantidad: 1, precio: 650 }] },
  { id: 4, folio: 'COT-0004', clienteId: 1, fecha: haceDias(35), vigenciaDias: 15, estado: 'pendiente', lineas: [{ productoId: 4, cantidad: 20, precio: 95 }] },
  { id: 5, folio: 'COT-0005', clienteId: 4, fecha: haceDias(20), vigenciaDias: 15, estado: 'rechazada', lineas: [{ productoId: 5, cantidad: 5, precio: 210 }] },
  { id: 6, folio: 'COT-0006', clienteId: 5, fecha: haceDias(10), vigenciaDias: 15, estado: 'convertida', ventaFolio: 'VTA-0003', lineas: [{ productoId: 2, cantidad: 12, precio: 38.5 }, { productoId: 7, cantidad: 1, precio: 160 }] },
].map((c) => ({ ...c, total: totalDeLineas(c.lineas) }));

/** Fecha (Date) en la que vence la cotización */
export function venceEl(cotizacion) {
  const fecha = new Date(cotizacion.fecha);
  fecha.setDate(fecha.getDate() + cotizacion.vigenciaDias);
  return fecha;
}

/** Estado que se muestra: si sigue pendiente pero ya pasó su vigencia, es "vencida". */
export function estadoCotizacion(cotizacion, hoy = new Date()) {
  if (cotizacion.estado === 'pendiente' && venceEl(cotizacion) < hoy) return 'vencida';
  return cotizacion.estado;
}

export async function listarCotizaciones() {
  if (!API_URL) {
    await esperar(300);
    return [...cotizaciones];
  }
  return pedir('/api/quotes');
}

export async function crearCotizacion({ clienteId, vigenciaDias, lineas }) {
  if (!API_URL) {
    await esperar(300);
    const nueva = {
      id: Date.now(),
      folio: crearFolio('COT', cotizaciones.length + 1),
      clienteId,
      fecha: new Date().toISOString(),
      vigenciaDias,
      estado: 'pendiente',
      lineas,
      total: totalDeLineas(lineas),
    };
    cotizaciones = [nueva, ...cotizaciones];
    return nueva;
  }
  return pedir('/api/quotes', { method: 'POST', body: JSON.stringify({ clienteId, vigenciaDias, lineas }) });
}

/** Cambia el estado a 'aceptada' o 'rechazada' */
export async function cambiarEstadoCotizacion(id, estado) {
  if (!API_URL) {
    await esperar(300);
    const actualizada = { ...cotizaciones.find((c) => c.id === id), estado };
    cotizaciones = cotizaciones.map((c) => (c.id === id ? actualizada : c));
    return actualizada;
  }
  return pedir(`/api/quotes/${id}/status`, { method: 'PUT', body: JSON.stringify({ estado }) });
}

/** Solo para datos de ejemplo: la llama ventas.js cuando una cotización se vuelve venta. */
export function marcarConvertida(id, ventaFolio) {
  cotizaciones = cotizaciones.map((c) => (c.id === id ? { ...c, estado: 'convertida', ventaFolio } : c));
}
