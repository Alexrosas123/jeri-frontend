import { NavLink, useNavigate } from 'react-router-dom';
import Logo from '../Logo/Logo';
import { cerrarSesion, obtenerSesion } from '../../services/auth';
import usePermisos from '../../hooks/usePermisos';
import { nivelDelRol, nombreDelRol, pantallasPermitidas } from '../../utils/permisos';
import './Sidebar.css';


/** Menú lateral del sistema (componente "Barra lateral" en Figma). */
export default function Sidebar() {
  usePermisos(); // vuelve a dibujar el menú si cambian los permisos
  const navegar = useNavigate();
  const sesion = obtenerSesion();

  function salir() {
    cerrarSesion();
    navegar('/login');
  }

  return (
    <aside className="menu-lateral">
      <div className="menu-lateral__marca">
        <Logo tamano={36} />
        <div>
          <p className="menu-lateral__nombre">Medidental JERI</p>
          <p className="menu-lateral__subtitulo">Sistema de gestión</p>
        </div>
      </div>

      <nav aria-label="Menú principal">
        <ul className="menu-lateral__lista">
          {pantallasPermitidas(sesion).map((opcion) => (
            <li key={opcion.ruta}>
              {/* NavLink agrega la clase "activo" cuando estamos en esa pantalla */}
              <NavLink
                to={opcion.ruta}
                className={({ isActive }) => `menu-lateral__opcion ${isActive ? 'menu-lateral__opcion--activa' : ''}`}
              >
                {opcion.texto}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="menu-lateral__usuario">
        <p className="menu-lateral__usuario-nombre">{sesion?.nombre ?? 'Usuario'}</p>
        <p className="menu-lateral__usuario-rol">{nombreDelRol(sesion?.rol) || 'Sin rol'}</p>
        <p className="menu-lateral__usuario-rol">
          Acceso: {nivelDelRol(sesion?.rol) === 'gerencia' ? 'gerencia (todo)' : 'operador'}
        </p>
        <button type="button" className="menu-lateral__salir" onClick={salir}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
