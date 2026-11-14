// Clientes (RF-04). Ruta del back-end por confirmar: /api/clients
// Cada cliente puede tener varias direcciones de entrega (`direcciones`: lista de textos).
import { crearCatalogo } from './catalogo';

export const clientes = crearCatalogo({
  ruta: '/api/clients',
  ejemplo: [
    { id: 1, nombre: 'Cliente de ejemplo A', rfc: 'CEA240101AB1', telefono: '55 0000 0001', correo: 'cliente.a@ejemplo.com', activo: true,
      direcciones: ['Av. Ejemplo 120, Col. Centro, Ciudad de México', 'Calle Muestra 45, Col. Del Valle, Ciudad de México'] },
    { id: 2, nombre: 'Cliente de ejemplo B', rfc: 'CEB240101AB2', telefono: '55 0000 0002', correo: 'cliente.b@ejemplo.com', activo: true,
      direcciones: ['Blvd. Prueba 300, Col. Industrial, Naucalpan'] },
    { id: 3, nombre: 'Cliente de ejemplo C', rfc: 'CEC240101AB3', telefono: '55 0000 0003', correo: 'cliente.c@ejemplo.com', activo: true,
      direcciones: ['Calle Ejemplo 8, Col. Roma, Ciudad de México', 'Av. Demo 1500, Col. Juárez, Ciudad de México', 'Privada Muestra 3, Coyoacán, Ciudad de México'] },
    { id: 4, nombre: 'Cliente de ejemplo D', rfc: 'CED240101AB4', telefono: '55 0000 0004', correo: 'cliente.d@ejemplo.com', activo: false, direcciones: [] },
    { id: 5, nombre: 'Cliente de ejemplo E', rfc: 'CEE240101AB5', telefono: '55 0000 0005', correo: 'cliente.e@ejemplo.com', activo: true,
      direcciones: ['Av. Prueba 77, Col. Narvarte, Ciudad de México'] },
    { id: 6, nombre: 'Cliente de ejemplo F', rfc: 'CEF240101AB6', telefono: '', correo: '', activo: true, direcciones: [] },
  ],
});

/** Direcciones de un cliente (acepta también el campo viejo `direccion` de un solo texto) */
export function direccionesDe(cliente) {
  if (!cliente) return [];
  if (Array.isArray(cliente.direcciones)) return cliente.direcciones;
  return cliente.direccion ? [cliente.direccion] : [];
}
