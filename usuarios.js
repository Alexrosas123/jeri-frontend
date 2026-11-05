/*
  Usuarios y roles (RF-02, RF-03).

  El back-end ya expone /api/users y /api/roles (ver bitácora del back-end).
  Si existe VITE_API_URL se usan esos servicios; si no, se trabaja con
  DATOS DE EJEMPLO que viven solo mientras la página está abierta.

  ⚠️ Confirmar con el equipo de back-end el formato exacto de cada usuario.
  Aquí se asume lo que describe la bitácora:
    { id_user, name, email, phone, state, rol: { id_rol, name } }
  Las funciones `desdeApi` y `haciaApi` traducen entre ese formato y el del front.
*/

const API_URL = import.meta.env.VITE_API_URL;

// Los 6 roles definidos en el documento del proyecto (sección 1.2)
const ROLES_EJEMPLO = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Ventas' },
  { id: 3, nombre: 'Compras' },
  { id: 4, nombre: 'Inventario' },
  { id: 5, nombre: 'Dirección / Gerencia' },
  { id: 6, nombre: 'Auxiliar administrativo' },
];

let usuariosEjemplo = [
  { id: 1, nombre: 'Usuario 01', correo: 'usuario01@ejemplo.com', telefono: '', activo: true, rolId: 1 },
  { id: 2, nombre: 'Usuario 02', correo: 'usuario02@ejemplo.com', telefono: '', activo: true, rolId: 2 },
  { id: 3, nombre: 'Usuario 03', correo: 'usuario03@ejemplo.com', telefono: '', activo: true, rolId: 3 },
  { id: 4, nombre: 'Usuario 04', correo: 'usuario04@ejemplo.com', telefono: '', activo: true, rolId: 4 },
  { id: 5, nombre: 'Usuario 05', correo: 'usuario05@ejemplo.com', telefono: '', activo: true, rolId: 5 },
  { id: 6, nombre: 'Usuario 06', correo: 'usuario06@ejemplo.com', telefono: '', activo: false, rolId: 6 },
];

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// ---- Traducción entre el formato del back-end y el del front ----
function desdeApi(u) {
  return {
    id: u.id_user ?? u.idUser ?? u.id,
    nombre: u.name ?? '',
    correo: u.email ?? '',
    telefono: u.phone ?? '',
    activo: (u.state ?? 'Activo') === 'Activo',
    rolId: u.rol?.id_rol ?? u.rol?.idRol ?? u.rol?.id ?? u.rol_id ?? null,
  };
}

function haciaApi(u) {
  return {
    name: u.nombre,
    email: u.correo,
    phone: u.telefono || null,
    state: u.activo ? 'Activo' : 'Inactivo',
    rol: { id_rol: Number(u.rolId) },
  };
}

async function pedir(ruta, opciones) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });
  if (!respuesta.ok) throw new Error('No se pudo completar la operación. Intenta de nuevo.');
  return respuesta.status === 204 ? null : respuesta.json();
}

// ---- Funciones que usa la pantalla ----

/** Regresa { usuarios, roles, esEjemplo } */
export async function obtenerUsuariosYRoles() {
  if (!API_URL) {
    await esperar(400);
    return { usuarios: [...usuariosEjemplo], roles: ROLES_EJEMPLO, esEjemplo: true };
  }
  const [usuarios, roles] = await Promise.all([pedir('/api/users'), pedir('/api/roles')]);
  return {
    usuarios: usuarios.map(desdeApi),
    roles: roles.map((r) => ({ id: r.id_rol ?? r.idRol ?? r.id, nombre: r.name })),
    esEjemplo: false,
  };
}

/** Crea un usuario y regresa el usuario guardado */
export async function crearUsuario(datos) {
  if (!API_URL) {
    await esperar(400);
    const nuevo = { ...datos, rolId: Number(datos.rolId), id: Date.now() };
    usuariosEjemplo = [...usuariosEjemplo, nuevo];
    return nuevo;
  }
  return desdeApi(await pedir('/api/users', { method: 'POST', body: JSON.stringify(haciaApi(datos)) }));
}

/** Actualiza un usuario existente y regresa el usuario guardado */
export async function actualizarUsuario(id, datos) {
  if (!API_URL) {
    await esperar(400);
    const actualizado = { ...datos, rolId: Number(datos.rolId), id };
    usuariosEjemplo = usuariosEjemplo.map((u) => (u.id === id ? actualizado : u));
    return actualizado;
  }
  return desdeApi(await pedir(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(haciaApi(datos)) }));
}
