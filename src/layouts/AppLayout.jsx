import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import { obtenerSesion } from '../services/auth';
import { puedeVer, rutaInicial } from '../utils/permisos';
import './AppLayout.css';

/**
 * Estructura de las pantallas internas: menú lateral + contenido.
 * Si no hay sesión iniciada, regresa al login.
 * Si el rol no tiene permiso para la pantalla (por ejemplo, un operador que
 * escribe /dashboard en la barra de direcciones), lo manda a su pantalla de inicio.
 */
export default function AppLayout() {
  const ubicacion = useLocation();
  const sesion = obtenerSesion();

  if (!sesion) {
    return <Navigate to="/login" replace />;
  }
  if (!puedeVer(sesion, ubicacion.pathname)) {
    return <Navigate to={rutaInicial(sesion)} replace />;
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
