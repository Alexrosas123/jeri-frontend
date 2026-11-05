/*
  Datos del Dashboard (RF-21) y alertas de inventario (RF-17).

  Mientras el back-end no tenga estos servicios, se regresan DATOS DE EJEMPLO.
  Cuando estén listos, se asume:
    GET /api/dashboard/resumen   → { ventasMes, comprasMes, productosPorResurtir }
    GET /api/inventario/alertas  → [{ id, producto, existencia, stockMinimo }]
  (confirmar las rutas con el equipo de back-end)
*/

const API_URL = import.meta.env.VITE_API_URL;

const EJEMPLO = {
  resumen: { ventasMes: 48250, comprasMes: 31780.5, productosPorResurtir: 4 },
  alertas: [
    { id: 1, producto: 'Guantes de nitrilo, caja 100 pzas', existencia: 0, stockMinimo: 20 },
    { id: 2, producto: 'Jeringa 5 ml, caja 100 pzas', existencia: 6, stockMinimo: 15 },
    { id: 3, producto: 'Gasa estéril 10 × 10 cm, paquete', existencia: 9, stockMinimo: 25 },
    { id: 4, producto: 'Cubrebocas tricapa, caja 50 pzas', existencia: 12, stockMinimo: 30 },
  ],
};

/** Regresa { resumen, alertas, esEjemplo } */
export async function obtenerDashboard() {
  if (!API_URL) {
    await new Promise((resolver) => setTimeout(resolver, 400));
    return { ...EJEMPLO, esEjemplo: true };
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
