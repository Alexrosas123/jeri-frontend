/*
  Productos, categorías, marcas (RF-06, RF-07) e inventario (RF-08, RF-09, RF-10).

  Productos e inventario comparten la misma información: cuando se registra
  una entrada o una salida, cambia la existencia del producto. Por eso viven
  en el mismo servicio.

  Rutas del back-end por confirmar con el equipo:
    GET/POST  /api/products          PUT /api/products/{id}
    GET/POST  /api/categories
    GET/POST  /api/brands
    GET/POST  /api/inventory/movements
    DELETE    /api/products/{id}   → borrado lógico: el producto deja de mostrarse, pero se
                                     conserva para el historial de ventas, compras e inventario
  Campos nuevos del producto: proveedorId (proveedor principal), activo (false = inhabilitado:
  no se puede comprar ni vender) y eliminado (true = ya no se muestra).
  Sin VITE_API_URL se usan DATOS DE EJEMPLO que viven mientras la página está abierta.
*/

import { obtenerSesion } from './auth';
import { haceDias } from '../utils/fechas';

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

export const usaEjemplo = !API_URL;

// ---------- Datos de ejemplo ----------
let categorias = [
  { id: 1, nombre: 'Material de curación' },
  { id: 2, nombre: 'Protección personal' },
  { id: 3, nombre: 'Desechables' },
  { id: 4, nombre: 'Equipo de diagnóstico' },
];

let marcas = [
  { id: 1, nombre: 'Marca A' },
  { id: 2, nombre: 'Marca B' },
  { id: 3, nombre: 'Marca C' },
];

// proveedorId = proveedor principal del producto · activo = se puede comprar y vender
let productos = [
  { id: 1, sku: 'MC-001', nombre: 'Gasa estéril 10 × 10 cm, paquete', categoriaId: 1, marcaId: 1, proveedorId: 1, precio: 45, existencia: 9, stockMinimo: 25 },
  { id: 2, sku: 'MC-002', nombre: 'Venda elástica 10 cm', categoriaId: 1, marcaId: 2, proveedorId: 2, precio: 38.5, existencia: 48, stockMinimo: 20 },
  { id: 3, sku: 'PP-001', nombre: 'Guantes de nitrilo, caja 100 pzas', categoriaId: 2, marcaId: 1, proveedorId: 1, precio: 189, existencia: 0, stockMinimo: 20 },
  { id: 4, sku: 'PP-002', nombre: 'Cubrebocas tricapa, caja 50 pzas', categoriaId: 2, marcaId: 3, proveedorId: 1, precio: 95, existencia: 12, stockMinimo: 30 },
  { id: 5, sku: 'DS-001', nombre: 'Jeringa 5 ml, caja 100 pzas', categoriaId: 3, marcaId: 2, proveedorId: 1, precio: 210, existencia: 6, stockMinimo: 15 },
  { id: 6, sku: 'DS-002', nombre: 'Abatelenguas de madera, caja 500', categoriaId: 3, marcaId: 3, proveedorId: 5, precio: 120, existencia: 35, stockMinimo: 10 },
  { id: 7, sku: 'ED-001', nombre: 'Termómetro digital', categoriaId: 4, marcaId: 1, proveedorId: 3, precio: 160, existencia: 22, stockMinimo: 5 },
  { id: 8, sku: 'ED-002', nombre: 'Baumanómetro aneroide', categoriaId: 4, marcaId: 2, proveedorId: 3, precio: 650, existencia: 14, stockMinimo: 5 },
  { id: 9, sku: 'MC-003', nombre: 'Algodón plisado 300 g', categoriaId: 1, marcaId: 3, proveedorId: 2, precio: 85, existencia: 4, stockMinimo: 10, activo: false },
].map((p) => ({ activo: true, eliminado: false, ...p }));

// Las fechas de ejemplo se calculan desde hoy para que siempre haya datos en "Este mes" (Reportes)
let movimientos = [
  { id: 1, productoId: 2, tipo: 'entrada', cantidad: 24, motivo: 'Compra', nota: 'COM-0002', usuario: 'Usuario de ejemplo', fecha: haceDias(12, 10, 15) },
  { id: 2, productoId: 3, tipo: 'salida', cantidad: 20, motivo: 'Venta', nota: 'VTA-0002', usuario: 'Usuario de ejemplo', fecha: haceDias(9, 12, 40) },
  { id: 3, productoId: 5, tipo: 'salida', cantidad: 4, motivo: 'Venta', nota: 'VTA-0004', usuario: 'Usuario de ejemplo', fecha: haceDias(2, 9, 5) },
];

// ---------- Productos ----------

/** Regresa { productos, categorias, marcas } */
export async function obtenerCatalogo() {
  if (!API_URL) {
    await esperar(300);
    return { productos: [...productos], categorias: [...categorias], marcas: [...marcas] };
  }
  const [p, c, m] = await Promise.all([pedir('/api/products'), pedir('/api/categories'), pedir('/api/brands')]);
  return { productos: p, categorias: c, marcas: m };
}

export async function crearProducto(datos) {
  if (!API_URL) {
    await esperar(300);
    const nuevo = { activo: true, ...datos, id: Date.now(), existencia: 0, eliminado: false }; // un producto nuevo empieza sin existencias
    productos = [...productos, nuevo];
    return nuevo;
  }
  return pedir('/api/products', { method: 'POST', body: JSON.stringify(datos) });
}

export async function actualizarProducto(id, datos) {
  if (!API_URL) {
    await esperar(300);
    const anterior = productos.find((p) => p.id === id);
    const actualizado = { ...anterior, ...datos, id, existencia: anterior.existencia }; // la existencia solo cambia desde Inventario
    productos = productos.map((p) => (p.id === id ? actualizado : p));
    return actualizado;
  }
  return pedir(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
}

/**
 * "Elimina" un producto: deja de mostrarse en el catálogo, pero sigue existiendo
 * para que las ventas, compras y movimientos anteriores conserven su nombre.
 */
export async function eliminarProducto(id) {
  if (!API_URL) {
    await esperar(300);
    productos = productos.map((p) => (p.id === id ? { ...p, eliminado: true, activo: false } : p));
    return null;
  }
  return pedir(`/api/products/${id}`, { method: 'DELETE' });
}

// ---------- Categorías y marcas ----------

export async function agregarCategoria(nombre) {
  if (!API_URL) {
    await esperar(200);
    const nueva = { id: Date.now(), nombre };
    categorias = [...categorias, nueva];
    return nueva;
  }
  return pedir('/api/categories', { method: 'POST', body: JSON.stringify({ nombre }) });
}

export async function agregarMarca(nombre) {
  if (!API_URL) {
    await esperar(200);
    const nueva = { id: Date.now(), nombre };
    marcas = [...marcas, nueva];
    return nueva;
  }
  return pedir('/api/brands', { method: 'POST', body: JSON.stringify({ nombre }) });
}

// ---------- Inventario ----------

/** Regresa { productos, movimientos } */
export async function obtenerInventario() {
  if (!API_URL) {
    await esperar(300);
    return { productos: [...productos], movimientos: [...movimientos] };
  }
  const [p, m] = await Promise.all([pedir('/api/products'), pedir('/api/inventory/movements')]);
  return { productos: p, movimientos: m };
}

/**
 * Registra una entrada o salida de mercancía.
 * Regresa { producto, movimiento } con la existencia ya actualizada.
 */
export async function registrarMovimiento({ productoId, tipo, cantidad, motivo, nota }) {
  const usuario = obtenerSesion()?.nombre ?? 'Sin usuario';
  if (!API_URL) {
    await esperar(300);
    const producto = productos.find((p) => p.id === productoId);
    const nuevaExistencia = tipo === 'entrada' ? producto.existencia + cantidad : producto.existencia - cantidad;
    if (nuevaExistencia < 0) throw new Error('La salida es mayor a la existencia disponible.');

    const actualizado = { ...producto, existencia: nuevaExistencia };
    productos = productos.map((p) => (p.id === productoId ? actualizado : p));
    const movimiento = { id: Date.now() + productoId, productoId, tipo, cantidad, motivo, nota, usuario, fecha: new Date().toISOString() };
    movimientos = [movimiento, ...movimientos];
    return { producto: actualizado, movimiento };
  }
  return pedir('/api/inventory/movements', {
    method: 'POST',
    body: JSON.stringify({ productoId, tipo, cantidad, motivo, nota, usuario }),
  });
}
