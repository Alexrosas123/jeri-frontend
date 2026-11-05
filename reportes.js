/*
  Datos para Reportes (RF-18).

  Por ahora los reportes se calculan en el navegador juntando las listas de
  ventas, compras, cotizaciones, inventario, clientes y proveedores
  (ver utils/reportes.js). Si más adelante el back-end ofrece reportes ya
  calculados (por ejemplo GET /api/reports/sales?from=&to=), basta con cambiar
  esta función y utils/reportes.js.
*/
import { usaEjemplo } from './api';
import { clientes } from './clientes';
import { listarCompras } from './compras';
import { listarCotizaciones } from './cotizaciones';
import { obtenerInventario } from './productos';
import { proveedores } from './proveedores';
import { listarVentas } from './ventas';

export { usaEjemplo };

export async function obtenerDatosReportes() {
  const [ventas, compras, cotizaciones, inventario, listaClientes, listaProveedores] = await Promise.all([
    listarVentas(),
    listarCompras(),
    listarCotizaciones(),
    obtenerInventario(),
    clientes.listar(),
    proveedores.listar(),
  ]);
  return {
    ventas,
    compras,
    cotizaciones,
    productos: inventario.productos,
    movimientos: inventario.movimientos,
    clientes: listaClientes,
    proveedores: listaProveedores,
  };
}
