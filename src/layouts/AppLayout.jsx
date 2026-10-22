import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import { obtenerSesion } from '../services/auth';
import './AppLayout.css';

/**
 * Estructura de las pantallas internas: menú lateral + contenido.
 * Si no hay sesión iniciada, regresa al login.
 */
export default function AppLayout() {
  if (!obtenerSesion()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="estructura">
      <Sidebar />
      <main className="estructura__contenido">
        {/* Aquí se dibuja la pantalla de la ruta actual */}
        <Outlet />
      </main>
    </div>
  );
}
