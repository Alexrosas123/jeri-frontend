/*
  Ventas (RF-14) con descuento automático de inventario (RF-15).

  Antes de guardar se revisa que haya existencia suficiente de cada producto;
  al confirmar, cada producto genera una salida en el inventario.
  Una venta puede venir de una cotización (cotizacionId): la cotización queda "convertida".

  Rutas del back-end por confirmar con el equipo:
    GET/POST  /api/sales   (POST: { clienteId, cotizacionId?, lineas: [{ productoId, cantidad, precio }] })
  Con back-end, se asume que él descuenta las existencias y marca la cotización.
*/
import { API_URL, esperar, pedir, usaEjemplo } from './api';
import { obtenerInventario, registrarMovimiento } from './productos';
import { marcarConvertida } from './cotizaciones';
import { haceDias } from '../utils/fechas';
import { crearFolio, totalDeLineas } from '../utils/formato';

export { usaEjemplo };

// En cada línea, `precio` es el precio de venta unitario (IVA incluido).
let ventas = [
  { id: 1, folio: 'VTA-0001', clienteId: 1, fecha: haceDias(38, 12), lineas: [{ productoId: 7, cantidad: 3, precio: 160 }, { productoId: 1, cantidad: 10, precio: 45 }] },
  { id: 2, folio: 'VTA-0002', clienteId: 2, fecha: haceDias(9, 12), lineas: [{ productoId: 3, cantidad: 20, precio: 189 }] },
  { id: 3, folio: 'VTA-0003', clienteId: 5, fecha: haceDias(8, 17), cotizacionId: 6, lineas: [{ productoId: 2, cantidad: 12, precio: 38.5 }, { productoId: 7, cantidad: 1, precio: 160 }] },
  { id: 4, folio: 'VTA-0004', clienteId: 3, fecha: haceDias(2, 9), lineas: [{ productoId: 5, cantidad: 4, precio: 210 }, { productoId: 6, cantidad: 2, precio: 120 }] },
  { id: 5, folio: 'VTA-0005', clienteId: 1, fecha: haceDias(0, 9), lineas: [{ productoId: 2, cantidad: 6, precio: 38.5 }, { productoId: 8, cantidad: 1, precio: 650 }] },
].map((v) => ({ ...v, total: totalDeLineas(v.lineas) }));

export async function listarVentas() {
  if (!API_URL) {
    await esperar(300);
    return [...ventas];
  }
  return pedir('/api/sales');
}

/** Registra una venta y descuenta el inventario. Regresa la venta con su folio. */
export async function registrarVenta({ clienteId, lineas, cotizacionId }) {
  if (!API_URL) {
    // 1. Revisar existencias de TODOS los productos antes de mover nada
    const { productos } = await obtenerInventario();
    for (const linea of lineas) {
      const producto = productos.find((p) => p.id === linea.productoId);
      if (!producto || linea.cantidad > producto.existencia) {
        throw new Error(`No hay existencia suficiente de ${producto?.nombre ?? 'un producto'}.`);
      }
    }

    // 2. Guardar la venta y descontar el inventario
    const venta = {
      id: Date.now(),
      folio: crearFolio('VTA', ventas.length + 1),
      clienteId,
      cotizacionId,
      fecha: new Date().toISOString(),
      lineas,
      total: totalDeLineas(lineas),
    };
    for (const linea of lineas) {
      await registrarMovimiento({ productoId: linea.productoId, tipo: 'salida', cantidad: linea.cantidad, motivo: 'Venta', nota: venta.folio });
    }
    if (cotizacionId) marcarConvertida(cotizacionId, venta.folio);
    ventas = [venta, ...ventas];
    await esperar(200);
    return venta;
  }
  return pedir('/api/sales', { method: 'POST', body: JSON.stringify({ clienteId, lineas, cotizacionId }) });
}
