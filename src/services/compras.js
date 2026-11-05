/*
  Compras a proveedores (RF-11) y recepción de mercancía (RF-13).

  Cuando una compra se marca como "mercancía recibida", sus cantidades se suman
  al inventario (una entrada por cada producto).

  Rutas del back-end por confirmar con el equipo:
    GET/POST  /api/purchases                 (POST: { proveedorId, recibida, lineas: [{ productoId, cantidad, precio }] })
    PUT       /api/purchases/{id}/receive    (marca la compra como recibida)
  Con back-end, se asume que él mismo suma las existencias al recibir la compra.
*/
import { API_URL, esperar, pedir, usaEjemplo } from './api';
import { registrarMovimiento } from './productos';
import { haceDias } from '../utils/fechas';
import { crearFolio, totalDeLineas } from '../utils/formato';

export { usaEjemplo };

// En cada línea, `precio` es el costo unitario que cobra el proveedor.
let compras = [
  { id: 1, folio: 'COM-0001', proveedorId: 1, fecha: haceDias(40, 11), recibida: true, lineas: [{ productoId: 3, cantidad: 40, precio: 120 }, { productoId: 5, cantidad: 20, precio: 140 }] },
  { id: 2, folio: 'COM-0002', proveedorId: 2, fecha: haceDias(12, 10), recibida: true, lineas: [{ productoId: 2, cantidad: 24, precio: 22 }] },
  { id: 3, folio: 'COM-0003', proveedorId: 3, fecha: haceDias(6, 16), recibida: true, lineas: [{ productoId: 7, cantidad: 10, precio: 95 }, { productoId: 8, cantidad: 5, precio: 410 }] },
  { id: 4, folio: 'COM-0004', proveedorId: 1, fecha: haceDias(1, 13), recibida: false, lineas: [{ productoId: 1, cantidad: 30, precio: 28 }, { productoId: 4, cantidad: 30, precio: 60 }] },
].map((c) => ({ ...c, total: totalDeLineas(c.lineas) }));

export async function listarCompras() {
  if (!API_URL) {
    await esperar(300);
    return [...compras];
  }
  return pedir('/api/purchases');
}

/** Suma al inventario cada producto de la compra (solo con datos de ejemplo). */
async function sumarAlInventario(compra) {
  for (const linea of compra.lineas) {
    await registrarMovimiento({ productoId: linea.productoId, tipo: 'entrada', cantidad: linea.cantidad, motivo: 'Compra', nota: compra.folio });
  }
}

/** Registra una compra. Regresa la compra con su folio. */
export async function registrarCompra({ proveedorId, lineas, recibida }) {
  if (!API_URL) {
    await esperar(300);
    const compra = {
      id: Date.now(),
      folio: crearFolio('COM', compras.length + 1),
      proveedorId,
      fecha: new Date().toISOString(),
      recibida,
      lineas,
      total: totalDeLineas(lineas),
    };
    if (recibida) await sumarAlInventario(compra);
    compras = [compra, ...compras];
    return compra;
  }
  return pedir('/api/purchases', { method: 'POST', body: JSON.stringify({ proveedorId, lineas, recibida }) });
}

/** Marca como recibida una compra pendiente (RF-13) y suma sus productos al inventario. */
export async function marcarRecibida(id) {
  if (!API_URL) {
    await esperar(300);
    const compra = compras.find((c) => c.id === id);
    if (compra.recibida) throw new Error('Esta compra ya se había recibido.');
    await sumarAlInventario(compra);
    const actualizada = { ...compra, recibida: true };
    compras = compras.map((c) => (c.id === id ? actualizada : c));
    return actualizada;
  }
  return pedir(`/api/purchases/${id}/receive`, { method: 'PUT' });
}
