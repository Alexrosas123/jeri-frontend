/*
  Ventas (RF-14) con descuento automático de inventario (RF-15).

  Antes de guardar se revisa que haya existencia suficiente de cada producto;
  al confirmar, cada producto genera una salida en el inventario.
  Una venta puede venir de una cotización (cotizacionId): la cotización queda "convertida".

  Rutas del back-end por confirmar con el equipo:
    GET/POST  /api/sales   (POST: { clienteId, direccionEntrega?, cotizacionId?, lineas: [{ productoId, cantidad, precioLista, descuento, promocionId, precio }] })
  Con back-end, se asume que él descuenta las existencias y marca la cotización.
*/
import { API_URL, esperar, pedir, usaEjemplo } from './api';
import { obtenerInventario, registrarMovimiento } from './productos';
import { marcarConvertida } from './cotizaciones';
import { haceDias } from '../utils/fechas';
import { crearFolio, totalDeLineas } from '../utils/formato';

export { usaEjemplo };

/*
  Cada línea de venta guarda:
    precioLista  precio normal del producto
    descuento    % de descuento que se aplicó (0 en venta normal)
    promocionId  promoción que dio el descuento (o null)
    precio       precio final unitario (IVA incluido) = precioLista − descuento
  La venta guarda `tipo`: 'normal' o 'promocion' (si alguna línea tuvo descuento),
  y `descuentoTotal` en pesos.
*/

/** Completa los datos calculados de una venta (total, tipo, descuentoTotal) */
export function completarVenta(venta) {
  const lineas = venta.lineas.map((l) => ({ precioLista: l.precio, descuento: 0, promocionId: null, ...l }));
  const descuentoTotal = lineas.reduce((s, l) => s + (l.precioLista - l.precio) * l.cantidad, 0);
  return {
    ...venta,
    lineas,
    total: totalDeLineas(lineas),
    descuentoTotal: Math.round(descuentoTotal * 100) / 100,
    tipo: lineas.some((l) => l.descuento > 0) ? 'promocion' : 'normal',
  };
}

let ventas = [
  { id: 1, folio: 'VTA-0001', clienteId: 1, fecha: haceDias(38, 12), direccionEntrega: 'Av. Ejemplo 120, Col. Centro, Ciudad de México', lineas: [{ productoId: 7, cantidad: 3, precio: 160 }, { productoId: 1, cantidad: 10, precio: 45 }] },
  { id: 2, folio: 'VTA-0002', clienteId: 2, fecha: haceDias(9, 12), direccionEntrega: 'Blvd. Prueba 300, Col. Industrial, Naucalpan', lineas: [{ productoId: 3, cantidad: 20, precio: 189 }] },
  { id: 3, folio: 'VTA-0003', clienteId: 5, fecha: haceDias(8, 17), cotizacionId: 6, lineas: [{ productoId: 2, cantidad: 12, precio: 38.5 }, { productoId: 7, cantidad: 1, precio: 160 }] },
  { id: 4, folio: 'VTA-0004', clienteId: 3, fecha: haceDias(2, 9), direccionEntrega: 'Av. Demo 1500, Col. Juárez, Ciudad de México', lineas: [{ productoId: 5, cantidad: 4, precio: 210 }, { productoId: 6, cantidad: 2, precio: 120 }] },
  { id: 5, folio: 'VTA-0005', clienteId: 1, fecha: haceDias(0, 9), direccionEntrega: 'Calle Muestra 45, Col. Del Valle, Ciudad de México', lineas: [{ productoId: 2, cantidad: 6, precio: 38.5 }, { productoId: 8, cantidad: 1, precio: 650 }] },
  { id: 6, folio: 'VTA-0006', clienteId: 7, fecha: haceDias(5, 11), direccionEntrega: 'Av. Muestra 900, Col. Lindavista, Ciudad de México', lineas: [{ productoId: 8, cantidad: 2, precio: 650 }, { productoId: 4, cantidad: 10, precio: 95 }] },
  { id: 7, folio: 'VTA-0007', clienteId: 2, fecha: haceDias(15, 13), direccionEntrega: 'Blvd. Prueba 300, Col. Industrial, Naucalpan', lineas: [{ productoId: 7, cantidad: 5, precioLista: 160, descuento: 15, promocionId: 3, precio: 136 }] },
  { id: 8, folio: 'VTA-0008', clienteId: 8, fecha: haceDias(25, 10), direccionEntrega: 'Calle Prueba 12, Col. Centro, Toluca', lineas: [{ productoId: 6, cantidad: 4, precio: 120 }] },
  { id: 9, folio: 'VTA-0009', clienteId: 10, fecha: haceDias(45, 16), direccionEntrega: 'Av. Ejemplo 55, Col. Satélite, Naucalpan', lineas: [{ productoId: 1, cantidad: 20, precio: 45 }] },
  { id: 10, folio: 'VTA-0010', clienteId: 3, fecha: haceDias(60, 12), direccionEntrega: 'Calle Ejemplo 8, Col. Roma, Ciudad de México', lineas: [{ productoId: 8, cantidad: 1, precio: 650 }] },
  { id: 11, folio: 'VTA-0011', clienteId: 1, fecha: haceDias(12, 12), direccionEntrega: 'Av. Ejemplo 120, Col. Centro, Ciudad de México', lineas: [{ productoId: 1, cantidad: 10, precioLista: 45, descuento: 5, promocionId: 2, precio: 42.75 }, { productoId: 3, cantidad: 5, precioLista: 189, descuento: 10, promocionId: 1, precio: 170.1 }] },
  { id: 12, folio: 'VTA-0012', clienteId: 7, fecha: haceDias(70, 9), lineas: [{ productoId: 5, cantidad: 6, precio: 210 }] },
  { id: 13, folio: 'VTA-0013', clienteId: 9, fecha: haceDias(100, 15), lineas: [{ productoId: 7, cantidad: 2, precio: 160 }] },
  { id: 14, folio: 'VTA-0014', clienteId: 5, fecha: haceDias(3, 17), direccionEntrega: 'Av. Prueba 77, Col. Narvarte, Ciudad de México', lineas: [{ productoId: 4, cantidad: 5, precio: 95 }] },
  { id: 15, folio: 'VTA-0015', clienteId: 2, fecha: haceDias(30, 10), direccionEntrega: 'Blvd. Prueba 300, Col. Industrial, Naucalpan', lineas: [{ productoId: 8, cantidad: 3, precio: 650 }] },
  { id: 16, folio: 'VTA-0016', clienteId: 11, fecha: haceDias(130, 11), lineas: [{ productoId: 6, cantidad: 3, precio: 120 }] },
  { id: 17, folio: 'VTA-0017', clienteId: 12, fecha: haceDias(150, 16), lineas: [{ productoId: 2, cantidad: 4, precio: 38.5 }] },
  { id: 18, folio: 'VTA-0018', clienteId: 6, fecha: haceDias(200, 10), lineas: [{ productoId: 4, cantidad: 2, precio: 95 }] },
].map(completarVenta);

export async function listarVentas() {
  if (!API_URL) {
    await esperar(300);
    return [...ventas];
  }
  return (await pedir('/api/sales')).map(completarVenta);
}

/** Registra una venta y descuenta el inventario. Regresa la venta con su folio. */
export async function registrarVenta({ clienteId, lineas, cotizacionId, direccionEntrega = '' }) {
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
    const venta = completarVenta({
      id: Date.now(),
      folio: crearFolio('VTA', ventas.length + 1),
      clienteId,
      cotizacionId,
      direccionEntrega,
      fecha: new Date().toISOString(),
      lineas,
    });
    for (const linea of lineas) {
      await registrarMovimiento({ productoId: linea.productoId, tipo: 'salida', cantidad: linea.cantidad, motivo: 'Venta', nota: venta.folio });
    }
    if (cotizacionId) marcarConvertida(cotizacionId, venta.folio);
    ventas = [venta, ...ventas];
    await esperar(200);
    return venta;
  }
  return completarVenta(await pedir('/api/sales', { method: 'POST', body: JSON.stringify({ clienteId, lineas, cotizacionId, direccionEntrega }) }));
}
