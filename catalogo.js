/*
  Servicio genérico para catálogos (clientes, proveedores, productos...).

  Cada catálogo se crea con `crearCatalogo({ ruta, ejemplo })` y regresa
  las funciones listar, crear y actualizar.

  - Si existe VITE_API_URL, usa el back-end:
      GET  {ruta}        → lista
      POST {ruta}        → crear
      PUT  {ruta}/{id}   → actualizar
  - Si no, trabaja con los DATOS DE EJEMPLO, que viven mientras la página está abierta.

  ⚠️ Las rutas y los nombres de los campos se deben confirmar con el equipo de back-end.
     Si el back-end usa otros nombres (por ejemplo `name` en vez de `nombre`),
     se agregan funciones `desdeApi` / `haciaApi` como en services/usuarios.js.
*/

const API_URL = import.meta.env.VITE_API_URL;
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function pedir(ruta, opciones) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });
  if (!respuesta.ok) throw new Error('No se pudo completar la operación. Intenta de nuevo.');
  return respuesta.status === 204 ? null : respuesta.json();
}

export function crearCatalogo({ ruta, ejemplo }) {
  let registros = [...ejemplo];

  return {
    usaEjemplo: !API_URL,

    async listar() {
      if (!API_URL) {
        await esperar(300);
        return [...registros];
      }
      return pedir(ruta);
    },

    async crear(datos) {
      if (!API_URL) {
        await esperar(300);
        const nuevo = { ...datos, id: Date.now() };
        registros = [...registros, nuevo];
        return nuevo;
      }
      return pedir(ruta, { method: 'POST', body: JSON.stringify(datos) });
    },

    async actualizar(id, datos) {
      if (!API_URL) {
        await esperar(300);
        const actualizado = { ...datos, id };
        registros = registros.map((r) => (r.id === id ? actualizado : r));
        return actualizado;
      }
      return pedir(`${ruta}/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
    },
  };
}
