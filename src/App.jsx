import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login/Login';
import EnConstruccion from './pages/EnConstruccion';
import Dashboard from './pages/Dashboard/Dashboard';
import Usuarios from './pages/Usuarios/Usuarios';
import Clientes from './pages/Clientes/Clientes';
import Proveedores from './pages/Proveedores/Proveedores';
import Productos from './pages/Productos/Productos';
import Inventario from './pages/Inventario/Inventario';

// Pantallas internas pendientes de programar (se reemplazan una por una)
const PENDIENTES = [
  { ruta: 'compras', titulo: 'Registrar compra', requerimientos: 'RF-11, RF-13' },
  { ruta: 'ventas', titulo: 'Registrar venta', requerimientos: 'RF-14, RF-15' },
  { ruta: 'cotizaciones', titulo: 'Cotizaciones', requerimientos: 'RF-16' },
  { ruta: 'reportes', titulo: 'Reportes', requerimientos: 'RF-18' },
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Todas estas pantallas usan el menú lateral y requieren sesión */}
      <Route element={<AppLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="productos" element={<Productos />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="usuarios" element={<Usuarios />} />
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
