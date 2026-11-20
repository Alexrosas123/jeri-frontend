/*
  Permisos por rol (qué pantallas ve cada usuario).

  Hay dos niveles:
    - Gerencia: ve TODO el sistema.
    - Operador: hace el trabajo diario, pero NO ve Dashboard, Reportes,
      Administración de ventas y compras ni Usuarios.

  ¿Qué roles son de gerencia? Los que en su nombre dicen "Administrador"
  (o "Admin"), "Gerencia", "Gerente" o "Dirección". Cualquier otro rol
  (Ventas, Compras, Inventario, Auxiliar administrativo…) es operador.

  Para cambiar qué ve el operador, solo hay que mover rutas de SOLO_GERENCIA.
  ⚠️ Esto solo oculta pantallas en el front-end; el back-end también debe
     revisar el rol en cada servicio.
*/

// Todas las pantallas del menú, en orden
export const PANTALLAS = [
  { ruta: '/dashboard', texto: 'Dashboard' },
  { ruta: '/clientes', texto: 'Clientes' },
  { ruta: '/proveedores', texto: 'Proveedores' },
  { ruta: '/productos', texto: 'Productos' },
  { ruta: '/inventario', texto: 'Inventario' },
  { ruta: '/compras', texto: 'Compras' },
  { ruta: '/ventas', texto: 'Ventas' },
  { ruta: '/promociones', texto: 'Promociones' },
  { ruta: '/devoluciones', texto: 'Devoluciones' },
  { ruta: '/cotizaciones', texto: 'Cotizaciones' },
  { ruta: '/administracion', texto: 'Administración' },
  { ruta: '/reportes', texto: 'Reportes' },
  { ruta: '/usuarios', texto: 'Usuarios' },
];

// Pantallas que solo ve gerencia
export const SOLO_GERENCIA = ['/dashboard', '/administracion', '/reportes', '/usuarios'];

/** Nombre del rol, venga como texto ("Ventas") o como objeto ({ name: 'Ventas' }) */
export function nombreDelRol(rol) {
  if (!rol) return '';
  if (typeof rol === 'string') return rol;
  return rol.name ?? rol.nombre ?? '';
}

/** 'gerencia' u 'operador' según el nombre del rol */
export function nivelDelRol(rol) {
  const nombre = nombreDelRol(rol)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita acentos: "Dirección" → "direccion"
  return /\badmin\b|administrador|gerencia|gerente|direccion/.test(nombre) ? 'gerencia' : 'operador';
}

/** ¿Este usuario puede abrir esta ruta? (acepta subrutas como /productos/7) */
export function puedeVer(sesion, ruta) {
  if (!sesion) return false;
  if (nivelDelRol(sesion.rol) === 'gerencia') return true;
  return !SOLO_GERENCIA.some((r) => ruta === r || ruta.startsWith(`${r}/`));
}

/** Pantallas del menú que ve este usuario */
export function pantallasPermitidas(sesion) {
  return PANTALLAS.filter((p) => puedeVer(sesion, p.ruta));
}

/** A dónde mandar al usuario al entrar: gerencia al Dashboard, operador a Ventas */
export function rutaInicial(sesion) {
  return puedeVer(sesion, '/dashboard') ? '/dashboard' : '/ventas';
}
