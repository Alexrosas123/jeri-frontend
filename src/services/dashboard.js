/*
  Datos del Dashboard (RF-21) y alertas de inventario (RF-17).

  Sin back-end (sin VITE_API_URL), el resumen se calcula con los DATOS DE EJEMPLO
  de ventas, compras e inventario.
  Cuando estén listos, se asume:
    GET /api/dashboard/resumen   → { ventasMes, comprasMes, productosPorResurtir }
    GET /api/inventario/alertas  → [{ id, producto, existencia, stockMinimo }]
  (confirmar las rutas con el equipo de back-end)
*/

import { listarCompras } from './compras';
import { obtenerInventario } from './productos';
import { listarVentas } from './ventas';
import { estadoExistencia, estaDisponible } from '../utils/inventario';

const API_URL = import.meta.env.VITE_API_URL;

// Sin back-end, el resumen se calcula con los datos de ejemplo de ventas, compras e inventario
async function resumenDeEjemplo() {
  const [ventas, compras, inventario] = await Promise.all([listarVentas(), listarCompras(), obtenerInventario()]);
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const delMes = (lista) => lista.filter((x) => new Date(x.fecha) >= inicioMes).reduce((s, x) => s + x.total, 0);
  const alertas = inventario.productos
    .filter((p) => estaDisponible(p) && estadoExistencia(p).tipo !== 'ok')
    .sort((a, b) => a.existencia - b.existencia)
    .map((p) => ({ id: p.id, producto: p.nombre, existencia: p.existencia, stockMinimo: p.stockMinimo }));
  return {
    resumen: { ventasMes: delMes(ventas), comprasMes: delMes(compras), productosPorResurtir: alertas.length },
    alertas,
  };
}

/** Regresa { resumen, alertas, esEjemplo } */
export async function obtenerDashboard() {
  if (!API_URL) {
    return { ...(await resumenDeEjemplo()), esEjemplo: true };
  }

  const [resResumen, resAlertas] = await Promise.all([
    fetch(`${API_URL}/api/dashboard/resumen`),
    fetch(`${API_URL}/api/inventario/alertas`),
  ]);
  if (!resResumen.ok || !resAlertas.ok) {
    throw new Error('No se pudo cargar la información del dashboard.');
  }
  return { resumen: await resResumen.json(), alertas: await resAlertas.json(), esEjemplo: false };
}
