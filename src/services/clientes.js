// Clientes (RF-04). Ruta del back-end por confirmar: /api/clients
import { crearCatalogo } from './catalogo';

export const clientes = crearCatalogo({
  ruta: '/api/clients',
  ejemplo: [
    { id: 1, nombre: 'Cliente de ejemplo A', rfc: 'CEA240101AB1', telefono: '55 0000 0001', correo: 'cliente.a@ejemplo.com', direccion: '', activo: true },
    { id: 2, nombre: 'Cliente de ejemplo B', rfc: 'CEB240101AB2', telefono: '55 0000 0002', correo: 'cliente.b@ejemplo.com', direccion: '', activo: true },
    { id: 3, nombre: 'Cliente de ejemplo C', rfc: 'CEC240101AB3', telefono: '55 0000 0003', correo: 'cliente.c@ejemplo.com', direccion: '', activo: true },
    { id: 4, nombre: 'Cliente de ejemplo D', rfc: 'CED240101AB4', telefono: '55 0000 0004', correo: 'cliente.d@ejemplo.com', direccion: '', activo: false },
    { id: 5, nombre: 'Cliente de ejemplo E', rfc: 'CEE240101AB5', telefono: '55 0000 0005', correo: 'cliente.e@ejemplo.com', direccion: '', activo: true },
    { id: 6, nombre: 'Cliente de ejemplo F', rfc: 'CEF240101AB6', telefono: '', correo: '', direccion: '', activo: true },
  ],
});
