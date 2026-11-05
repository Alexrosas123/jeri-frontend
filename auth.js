/*
  Servicio de autenticación (RF-01).

  Mientras el back-end no tenga el servicio de inicio de sesión, la función
  `iniciarSesion` SIMULA la respuesta para poder probar la pantalla.

  Cuando el back-end esté listo:
    1. Crea un archivo `.env` (copia `.env.example`) con la URL del back-end:
         VITE_API_URL=http://localhost:8080
    2. Confirma con el equipo de back la ruta y la respuesta del servicio
       (aquí se asume POST /api/auth/login → { nombre, rol, token }).
*/

const API_URL = import.meta.env.VITE_API_URL;
const CLAVE_SESION = 'medidental-sesion';

export async function iniciarSesion(correo, contrasena) {
  // --- Simulación (sin back-end) ---
  if (!API_URL) {
    await new Promise((resolver) => setTimeout(resolver, 800));
    const sesion = { nombre: 'Usuario de ejemplo', rol: 'Administrador', correo, simulada: true };
    guardarSesion(sesion);
    return sesion;
  }

  // --- Conexión real con el back-end ---
  const respuesta = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: contrasena }),
  });

  if (!respuesta.ok) {
    throw new Error(
      respuesta.status === 401 ? 'Correo o contraseña incorrectos.' : 'No se pudo iniciar sesión. Intenta de nuevo.',
    );
  }

  const sesion = await respuesta.json();
  guardarSesion(sesion);
  return sesion;
}

export function obtenerSesion() {
  try {
    const guardada = sessionStorage.getItem(CLAVE_SESION);
    return guardada ? JSON.parse(guardada) : null;
  } catch {
    return null;
  }
}

export function cerrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    /* sin acceso al almacenamiento: no hay nada que borrar */
  }
}

function guardarSesion(sesion) {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    /* si el navegador bloquea el almacenamiento, la sesión dura solo esta página */
  }
}
