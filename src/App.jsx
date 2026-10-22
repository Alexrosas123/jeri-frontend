import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login/Login';
import EnConstruccion from './pages/EnConstruccion';
import Dashboard from './pages/Dashboard/Dashboard';

// Pantallas internas pendientes de programar (se reemplazan una por una)
const PENDIENTES = [
  { ruta: 'clientes', titulo: 'Clientes', requerimientos: 'RF-04' },
  { ruta: 'proveedores', titulo: 'Proveedores', requerimientos: 'RF-05' },
  { ruta: 'productos', titulo: 'Productos', requerimientos: 'RF-06, RF-07' },
  { ruta: 'inventario', titulo: 'Inventario', requerimientos: 'RF-08, RF-09, RF-10' },
  { ruta: 'compras', titulo: 'Registrar compra', requerimientos: 'RF-11, RF-13' },
  { ruta: 'ventas', titulo: 'Registrar venta', requerimientos: 'RF-14, RF-15' },
  { ruta: 'cotizaciones', titulo: 'Cotizaciones', requerimientos: 'RF-16' },
  { ruta: 'reportes', titulo: 'Reportes', requerimientos: 'RF-18' },
  { ruta: 'usuarios', titulo: 'Usuarios y roles', requerimientos: 'RF-02, RF-03' },
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Todas estas pantallas usan el menú lateral y requieren sesión */}
      <Route element={<AppLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        {PENDIENTES.map((p) => (
          <Route
            key={p.ruta}
            path={p.ruta}
            element={<EnConstruccion titulo={p.titulo} requerimientos={p.requerimientos} />}
          />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
