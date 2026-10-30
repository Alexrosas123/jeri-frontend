// Proveedores (RF-05). Ruta del back-end por confirmar: /api/suppliers
import { crearCatalogo } from './catalogo';

export const proveedores = crearCatalogo({
  ruta: '/api/suppliers',
  ejemplo: [
    { id: 1, nombre: 'Proveedor de ejemplo A', rfc: 'PEA240101AB1', contacto: 'Nombre de contacto', telefono: '55 1000 0001', correo: 'ventas@proveedor-a.ejemplo.com', activo: true },
    { id: 2, nombre: 'Proveedor de ejemplo B', rfc: 'PEB240101AB2', contacto: 'Nombre de contacto', telefono: '55 1000 0002', correo: 'ventas@proveedor-b.ejemplo.com', activo: true },
    { id: 3, nombre: 'Proveedor de ejemplo C', rfc: 'PEC240101AB3', contacto: 'Nombre de contacto', telefono: '55 1000 0003', correo: '', activo: true },
    { id: 4, nombre: 'Proveedor de ejemplo D', rfc: 'PED240101AB4', contacto: '', telefono: '', correo: '', activo: false },
    { id: 5, nombre: 'Proveedor de ejemplo E', rfc: 'PEE240101AB5', contacto: 'Nombre de contacto', telefono: '55 1000 0005', correo: '', activo: true },
  ],
});
