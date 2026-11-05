// Funciones comunes para hablar con el back-end (las usan compras, ventas, cotizaciones y reportes)

export const API_URL = import.meta.env.VITE_API_URL;

/** true mientras no haya back-end configurado (se usan datos de ejemplo) */
export const usaEjemplo = !API_URL;

/** Simula el tiempo que tarda el back-end en responder */
export const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export async function pedir(ruta, opciones) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });
  if (!respuesta.ok) throw new Error('No se pudo completar la operación. Intenta de nuevo.');
  return respuesta.status === 204 ? null : respuesta.json();
}
