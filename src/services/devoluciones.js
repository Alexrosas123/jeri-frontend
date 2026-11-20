/*
  Devoluciones de cliente.

  Una devolución siempre parte de una venta: se eligen los productos y cuántas
  piezas regresan (nunca más de las que se vendieron, contando devoluciones
  anteriores). El importe a reembolsar usa el precio que pagó el cliente
  (ya con descuento, si la venta fue con promoción).
  Si las piezas vienen en buen estado, se regresan al inventario (entrada
  con motivo "Devolución de cliente").

  Rutas del back-end por confirmar con el equipo:
    GET/POST  /api/returns
    POST: { ventaId, motivo, regresarInventario, nota, lineas: [{ productoId, cantidad, precio }] }
*/
import { API_URL, esperar, pedir, usaEjemplo } from './api';
import { registrarMovimiento } from './productos';
import { haceDias } from '../utils/fechas';
import { crearFolio, totalDeLineas } from '../utils/formato';

export { usaEjemplo };

export const MOTIVOS_DEVOLUCION = ['Producto dañado', 'Producto caducado', 'Error en el pedido', 'El cliente ya no lo necesita', 'Otro'];

let devoluciones = [
  {
    id: 1,
    folio: 'DEV-0001',
    ventaId: 4,
    ventaFolio: 'VTA-0004',
    clienteId: 3,
    fecha: haceDias(1, 12),
    motivo: 'Producto dañado',
    regresarInventario: false,
    nota: 'Caja golpeada en el envío',
    lineas: [{ productoId: 6, cantidad: 1, precio: 120 }],
  },
].map((d) => ({ ...d, total: totalDeLineas(d.lineas) }));

export async function listarDevoluciones() {
  if (!API_URL) {
    await esperar(300);
    return [...devoluciones];
  }
  return pedir('/api/returns');
}

/** Piezas de cada producto que ya se devolvieron de una venta: { [productoId]: cantidad } */
export function yaDevuelto(listaDevoluciones, ventaId) {
  const resultado = {};
  for (const d of listaDevoluciones.filter((x) => x.ventaId === ventaId)) {
    for (const l of d.lineas) resultado[l.productoId] = (resultado[l.productoId] ?? 0) + l.cantidad;
  }
  return resultado;
}

/** Registra la devolución; si `regresarInventario`, suma las piezas al inventario */
export async function registrarDevolucion({ venta, lineas, motivo, regresarInventario, nota }) {
  if (!API_URL) {
    await esperar(300);
    // Revisar que no se devuelva más de lo vendido
    const devuelto = yaDevuelto(devoluciones, venta.id);
    for (const l of lineas) {
      const vendida = venta.lineas.find((x) => x.productoId === l.productoId)?.cantidad ?? 0;
      if (l.cantidad > vendida - (devuelto[l.productoId] ?? 0)) {
        throw new Error('Se intenta devolver más piezas de las que quedan por devolver en esa venta.');
      }
    }
    const devolucion = {
      id: Date.now(),
      folio: crearFolio('DEV', devoluciones.length + 1),
      ventaId: venta.id,
      ventaFolio: venta.folio,
      clienteId: venta.clienteId,
      fecha: new Date().toISOString(),
      motivo,
      regresarInventario,
      nota,
      lineas,
      total: totalDeLineas(lineas),
    };
    if (regresarInventario) {
      for (const l of lineas) {
        await registrarMovimiento({ productoId: l.productoId, tipo: 'entrada', cantidad: l.cantidad, motivo: 'Devolución de cliente', nota: devolucion.folio });
      }
    }
    devoluciones = [devolucion, ...devoluciones];
    return devolucion;
  }
  return pedir('/api/returns', {
    method: 'POST',
    body: JSON.stringify({ ventaId: venta.id, motivo, regresarInventario, nota, lineas }),
  });
}
