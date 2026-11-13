/*
  Cálculo de cada reporte (RF-18).

  construirReporte(id, datos, rango) regresa:
    { titulo, resumen: [{ etiqueta, valor }], columnas: [{ titulo, numero }], filas: [[...]], vacio }
  La pantalla de Reportes solo dibuja ese resultado en una tabla.
*/
import { estadoCotizacion } from '../services/cotizaciones';
import { estaEnRango } from './fechas';
import { formatearFecha, formatearFechaHora, formatearPesos } from './formato';
import { estadoExistencia, estaDisponible } from './inventario';

export const REPORTES = [
  { id: 'ventas', titulo: 'Ventas por periodo', descripcion: 'Total vendido, número de ventas y ticket promedio en el periodo seleccionado.' },
  { id: 'compras', titulo: 'Compras por proveedor', descripcion: 'Monto comprado a cada proveedor y compras pendientes de recibir.' },
  { id: 'mas-vendidos', titulo: 'Productos más vendidos', descripcion: 'Productos con más unidades vendidas en el periodo.' },
  { id: 'inventario-bajo', titulo: 'Inventario bajo y agotado', descripcion: 'Productos por debajo del stock mínimo o sin existencias.' },
  { id: 'movimientos', titulo: 'Movimientos de inventario', descripcion: 'Entradas y salidas registradas, con usuario y fecha.' },
  { id: 'cotizaciones', titulo: 'Cotizaciones', descripcion: 'Cotizaciones por estado: pendientes, aceptadas, vencidas y convertidas en venta.' },
];

const ETIQUETAS_ESTADO = {
  pendiente: 'Pendientes',
  aceptada: 'Aceptadas',
  vencida: 'Vencidas',
  rechazada: 'Rechazadas',
  convertida: 'Convertidas en venta',
};

const porFecha = (a, b) => new Date(b.fecha) - new Date(a.fecha);

export function construirReporte(id, datos, rango) {
  const nombre = (lista, idBuscado, respaldo) => lista.find((x) => x.id === idBuscado)?.nombre ?? respaldo;
  const enPeriodo = (lista) => lista.filter((x) => estaEnRango(x.fecha, rango)).sort(porFecha);
  const titulo = REPORTES.find((r) => r.id === id).titulo;

  if (id === 'ventas') {
    const ventas = enPeriodo(datos.ventas);
    const total = ventas.reduce((s, v) => s + v.total, 0);
    return {
      titulo,
      resumen: [
        { etiqueta: 'Total vendido', valor: formatearPesos(total) },
        { etiqueta: 'Número de ventas', valor: String(ventas.length) },
        { etiqueta: 'Ticket promedio', valor: formatearPesos(ventas.length ? total / ventas.length : 0) },
      ],
      columnas: [{ titulo: 'Folio' }, { titulo: 'Fecha' }, { titulo: 'Cliente' }, { titulo: 'Total', numero: true }],
      filas: ventas.map((v) => [v.folio, formatearFecha(v.fecha), nombre(datos.clientes, v.clienteId, 'Cliente'), formatearPesos(v.total)]),
      vacio: 'No hay ventas en este periodo.',
    };
  }

  if (id === 'compras') {
    const compras = enPeriodo(datos.compras);
    const grupos = new Map();
    for (const c of compras) {
      const g = grupos.get(c.proveedorId) ?? { compras: 0, monto: 0, porRecibir: 0 };
      g.compras += 1;
      g.monto += c.total;
      if (!c.recibida) g.porRecibir += 1;
      grupos.set(c.proveedorId, g);
    }
    const filas = [...grupos.entries()].sort((a, b) => b[1].monto - a[1].monto);
    const total = compras.reduce((s, c) => s + c.total, 0);
    return {
      titulo,
      resumen: [
        { etiqueta: 'Total comprado', valor: formatearPesos(total) },
        { etiqueta: 'Compras', valor: String(compras.length) },
        { etiqueta: 'Por recibir', valor: String(compras.filter((c) => !c.recibida).length) },
      ],
      columnas: [{ titulo: 'Proveedor' }, { titulo: 'Compras', numero: true }, { titulo: 'Monto', numero: true }, { titulo: 'Por recibir', numero: true }],
      filas: filas.map(([proveedorId, g]) => [nombre(datos.proveedores, proveedorId, 'Proveedor'), String(g.compras), formatearPesos(g.monto), String(g.porRecibir)]),
      vacio: 'No hay compras en este periodo.',
    };
  }

  if (id === 'mas-vendidos') {
    const unidades = new Map();
    for (const v of enPeriodo(datos.ventas)) {
      for (const l of v.lineas) {
        const u = unidades.get(l.productoId) ?? { cantidad: 0, importe: 0 };
        u.cantidad += l.cantidad;
        u.importe += l.cantidad * l.precio;
        unidades.set(l.productoId, u);
      }
    }
    const filas = [...unidades.entries()].sort((a, b) => b[1].cantidad - a[1].cantidad).slice(0, 10);
    return {
      titulo,
      resumen: [
        { etiqueta: 'Producto más vendido', valor: filas.length ? nombre(datos.productos, filas[0][0], 'Producto') : '—' },
        { etiqueta: 'Unidades vendidas', valor: String([...unidades.values()].reduce((s, u) => s + u.cantidad, 0)) },
      ],
      columnas: [{ titulo: '#' }, { titulo: 'Producto' }, { titulo: 'Unidades', numero: true }, { titulo: 'Importe', numero: true }],
      filas: filas.map(([productoId, u], i) => [String(i + 1), nombre(datos.productos, productoId, 'Producto'), String(u.cantidad), formatearPesos(u.importe)]),
      vacio: 'No hay ventas en este periodo.',
    };
  }

  if (id === 'inventario-bajo') {
    // Este reporte muestra el estado de HOY, no depende del periodo
    const bajos = datos.productos
      .filter((p) => estaDisponible(p) && estadoExistencia(p).tipo !== 'ok')
      .sort((a, b) => a.existencia - b.existencia);
    return {
      titulo,
      resumen: [
        { etiqueta: 'Agotados', valor: String(bajos.filter((p) => p.existencia <= 0).length) },
        { etiqueta: 'Con stock bajo', valor: String(bajos.filter((p) => p.existencia > 0).length) },
      ],
      columnas: [{ titulo: 'Producto' }, { titulo: 'Existencia', numero: true }, { titulo: 'Mínimo', numero: true }, { titulo: 'Faltan', numero: true }, { titulo: 'Estado' }],
      filas: bajos.map((p) => [p.nombre, String(p.existencia), String(p.stockMinimo), String(Math.max(p.stockMinimo - p.existencia, 0)), estadoExistencia(p).texto]),
      vacio: 'Todos los productos están por arriba de su stock mínimo.',
      nota: 'Muestra la existencia actual; no depende del periodo.',
    };
  }

  if (id === 'movimientos') {
    const movimientos = enPeriodo(datos.movimientos);
    const suma = (tipo) => movimientos.filter((m) => m.tipo === tipo).reduce((s, m) => s + m.cantidad, 0);
    return {
      titulo,
      resumen: [
        { etiqueta: 'Movimientos', valor: String(movimientos.length) },
        { etiqueta: 'Unidades que entraron', valor: String(suma('entrada')) },
        { etiqueta: 'Unidades que salieron', valor: String(suma('salida')) },
      ],
      columnas: [{ titulo: 'Fecha' }, { titulo: 'Producto' }, { titulo: 'Movimiento' }, { titulo: 'Cantidad', numero: true }, { titulo: 'Usuario' }],
      filas: movimientos.map((m) => [
        formatearFechaHora(m.fecha),
        nombre(datos.productos, m.productoId, 'Producto'),
        `${m.tipo === 'entrada' ? 'Entrada' : 'Salida'} · ${m.motivo}${m.nota ? ` (${m.nota})` : ''}`,
        `${m.tipo === 'entrada' ? '+' : '−'}${m.cantidad}`,
        m.usuario ?? '—',
      ]),
      vacio: 'No hay movimientos en este periodo.',
    };
  }

  // id === 'cotizaciones'
  const cotizaciones = enPeriodo(datos.cotizaciones);
  const grupos = Object.keys(ETIQUETAS_ESTADO).map((estado) => {
    const deEstado = cotizaciones.filter((c) => estadoCotizacion(c) === estado);
    return [ETIQUETAS_ESTADO[estado], String(deEstado.length), formatearPesos(deEstado.reduce((s, c) => s + c.total, 0))];
  });
  const convertidas = cotizaciones.filter((c) => c.estado === 'convertida').length;
  return {
    titulo,
    resumen: [
      { etiqueta: 'Cotizaciones', valor: String(cotizaciones.length) },
      { etiqueta: 'Convertidas en venta', valor: cotizaciones.length ? `${Math.round((convertidas / cotizaciones.length) * 100)} %` : '0 %' },
    ],
    columnas: [{ titulo: 'Estado' }, { titulo: 'Cotizaciones', numero: true }, { titulo: 'Monto', numero: true }],
    filas: cotizaciones.length ? grupos : [],
    vacio: 'No hay cotizaciones en este periodo.',
  };
}
