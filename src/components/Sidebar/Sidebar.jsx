import { NavLink, useNavigate } from 'react-router-dom';
import Logo from '../Logo/Logo';
import { cerrarSesion, obtenerSesion } from '../../services/auth';
import './Sidebar.css';

// Opciones del menú. Cada una apunta a una ruta definida en App.jsx.
const OPCIONES_MENU = [
  { ruta: '/dashboard', texto: 'Dashboard' },
  { ruta: '/clientes', texto: 'Clientes' },
  { ruta: '/proveedores', texto: 'Proveedores' },
  { ruta: '/productos', texto: 'Productos' },
  { ruta: '/inventario', texto: 'Inventario' },
  { ruta: '/compras', texto: 'Compras' },
  { ruta: '/ventas', texto: 'Ventas' },
  { ruta: '/cotizaciones', texto: 'Cotizaciones' },
  { ruta: '/reportes', texto: 'Reportes' },
  { ruta: '/usuarios', texto: 'Usuarios' },
];

/** Menú lateral del sistema (componente "Barra lateral" en Figma). */
export default function Sidebar() {
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
          {OPCIONES_MENU.map((opcion) => (
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
        <p className="menu-lateral__usuario-rol">{sesion?.rol ?? 'Sin rol'}</p>
        <button type="button" className="menu-lateral__salir" onClick={salir}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
