import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Usuarios from './pages/Usuarios/Usuarios';
import Clientes from './pages/Clientes/Clientes';
import Proveedores from './pages/Proveedores/Proveedores';
import Productos from './pages/Productos/Productos';
import Inventario from './pages/Inventario/Inventario';
import Compras from './pages/Compras/Compras';
import Ventas from './pages/Ventas/Ventas';
import Cotizaciones from './pages/Cotizaciones/Cotizaciones';
import Reportes from './pages/Reportes/Reportes';

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
        <Route path="compras" element={<Compras />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="cotizaciones" element={<Cotizaciones />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
