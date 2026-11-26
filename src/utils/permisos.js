/*
  Permisos por rol (qué pantallas ve cada usuario).

  Hay dos niveles:
    - Gerencia: los roles cuyo nombre dice "Administrador" (o "Admin"),
      "Gerencia", "Gerente" o "Dirección".
    - Operador: cualquier otro rol (Ventas, Compras, Inventario, Auxiliar administrativo…).

  Qué pantalla ve cada nivel se prende y apaga desde Usuarios → "Permisos por rol".
  Por defecto, gerencia ve todo y el operador no ve Dashboard, Reportes,
  Administración ni Usuarios (SOLO_GERENCIA).

  Mientras no haya back-end para guardarlos, los permisos se guardan en este
  navegador (localStorage). Reglas para no quedarse sin acceso:
    - Gerencia siempre puede abrir Usuarios (si no, nadie podría volver a prender nada).
    - Cada nivel debe tener al menos una pantalla prendida.

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

// Pantallas que, por defecto, solo ve gerencia
export const SOLO_GERENCIA = ['/dashboard', '/administracion', '/reportes', '/usuarios'];

export const NIVELES = ['gerencia', 'operador'];

// Pantalla que gerencia nunca puede apagar
export const SIEMPRE_GERENCIA = '/usuarios';

const CLAVE = 'medidental-permisos';

/** Permisos de fábrica: { gerencia: { '/dashboard': true, … }, operador: { … } } */
export function permisosPorDefecto() {
  return {
    gerencia: Object.fromEntries(PANTALLAS.map((p) => [p.ruta, true])),
    operador: Object.fromEntries(PANTALLAS.map((p) => [p.ruta, !SOLO_GERENCIA.includes(p.ruta)])),
  };
}

function leerGuardados() {
  const base = permisosPorDefecto();
  try {
    const guardados = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    if (!guardados) return base;
    // Se combinan con los de fábrica por si después se agregan pantallas nuevas
    return {
      gerencia: { ...base.gerencia, ...guardados.gerencia, [SIEMPRE_GERENCIA]: true },
      operador: { ...base.operador, ...guardados.operador },
    };
  } catch {
    return base; // sin acceso al almacenamiento o datos dañados: permisos de fábrica
  }
}

// ---- Pequeño "almacén" para que el menú se actualice en cuanto cambia un switch ----
let permisos = leerGuardados();
const avisar = new Set();

export function suscribirPermisos(alCambiar) {
  avisar.add(alCambiar);
  return () => avisar.delete(alCambiar);
}

export function obtenerPermisos() {
  return permisos;
}

function guardar(nuevos) {
  permisos = nuevos;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevos));
  } catch {
    /* si el navegador no deja guardar, el cambio dura mientras la página esté abierta */
  }
  avisar.forEach((fn) => fn());
}

/** Si un switch no se puede apagar, regresa el motivo; si sí se puede, regresa '' */
export function motivoBloqueo(nivel, ruta, actuales = permisos) {
  if (!actuales[nivel][ruta]) return ''; // prenderlo siempre se puede
  if (nivel === 'gerencia' && ruta === SIEMPRE_GERENCIA) return 'Gerencia siempre debe poder entrar a Usuarios.';
  const prendidas = Object.values(actuales[nivel]).filter(Boolean).length;
  if (prendidas === 1) return 'Debe quedar al menos una pantalla prendida.';
  return '';
}

/** Prende o apaga una pantalla para un nivel */
export function cambiarPermiso(nivel, ruta, valor) {
  if (!valor && motivoBloqueo(nivel, ruta)) return;
  guardar({ ...permisos, [nivel]: { ...permisos[nivel], [ruta]: valor } });
}

/** Regresa todo a los permisos de fábrica */
export function restablecerPermisos() {
  guardar(permisosPorDefecto());
}

// ---- Funciones que usan el menú, las rutas y el login ----

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
    .replace(/[̀-ͯ]/g, ''); // quita acentos: "Dirección" → "direccion"
  return /\badmin\b|administrador|gerencia|gerente|direccion/.test(nombre) ? 'gerencia' : 'operador';
}

/** ¿Este usuario puede abrir esta ruta? (acepta subrutas como /productos/7) */
export function puedeVer(sesion, ruta) {
  if (!sesion) return false;
  const pantalla = PANTALLAS.find((p) => ruta === p.ruta || ruta.startsWith(`${p.ruta}/`));
  if (!pantalla) return true; // rutas que no son del menú
  return Boolean(permisos[nivelDelRol(sesion.rol)][pantalla.ruta]);
}

/** Pantallas del menú que ve este usuario */
export function pantallasPermitidas(sesion) {
  return PANTALLAS.filter((p) => puedeVer(sesion, p.ruta));
}

/** A dónde mandar al usuario al entrar: Dashboard si puede verlo; si no, Ventas o la primera que tenga */
export function rutaInicial(sesion) {
  if (puedeVer(sesion, '/dashboard')) return '/dashboard';
  if (puedeVer(sesion, '/ventas')) return '/ventas';
  return pantallasPermitidas(sesion)[0]?.ruta ?? '/login';
}
