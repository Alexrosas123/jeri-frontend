import { useState } from 'react';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import { formatearPesos } from '../../utils/formato';
import './BuscadorProductos.css';

/**
 * Ventana "Agregar producto" (Ventas y Cotizaciones): buscar por nombre o SKU
 * y agregar con un clic. Lo agregado se aplica hasta presionar "Listo".
 *
 * Props:
 *   productos      lista de productos ({ id, nombre, sku, precio, existencia })
 *   enLista        { [productoId]: cantidad } de lo que ya está en la venta
 *   validarExistencia  si es true, no deja agregar más de lo disponible (ventas)
 *   alTerminar(seleccion)  recibe { [productoId]: cantidadAgregada }
 */
export default function BuscadorProductos({ productos, enLista = {}, validarExistencia = false, alTerminar, alCerrar }) {
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState({});

  const texto = busqueda.trim().toLowerCase();
  const resultados = productos
    .filter((p) => !texto || p.nombre.toLowerCase().includes(texto) || p.sku.toLowerCase().includes(texto))
    .slice(0, 8);

  const agregar = (id) => setSeleccion((anterior) => ({ ...anterior, [id]: (anterior[id] ?? 0) + 1 }));
  const totalAgregado = Object.values(seleccion).reduce((a, b) => a + b, 0);

  return (
    <Modal
      abierto
      titulo="Agregar producto"
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={alCerrar}>Cancelar</Button>
          <Button onClick={() => alTerminar(seleccion)} disabled={totalAgregado === 0}>
            {totalAgregado > 0 ? `Listo (${totalAgregado})` : 'Listo'}
          </Button>
        </>
      }
    >
      <label htmlFor="buscar-producto-agregar" className="solo-lectores">Buscar producto por nombre o SKU</label>
      <input
        id="buscar-producto-agregar"
        type="search"
        className="campo__input"
        placeholder="Buscar por nombre o SKU"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <ul className="buscador__lista">
        {resultados.length === 0 && <li className="buscador__vacio">No hay productos con esa búsqueda.</li>}
        {resultados.map((p) => {
          const agregados = (enLista[p.id] ?? 0) + (seleccion[p.id] ?? 0);
          const disponibles = p.existencia - agregados;
          const sinExistencia = validarExistencia && disponibles <= 0;
          return (
            <li key={p.id} className="buscador__fila">
              <div>
                <p className="texto-principal">{p.nombre}</p>
                <p className="texto-secundario">
                  {formatearPesos(p.precio)} · Disponibles: {Math.max(p.existencia, 0)}
                  {seleccion[p.id] ? ` · agregando ${seleccion[p.id]}` : ''}
                </p>
              </div>
              <Button onClick={() => agregar(p.id)} disabled={sinExistencia} aria-label={`Agregar ${p.nombre}`}>
                {sinExistencia ? 'Sin existencia' : 'Agregar'}
              </Button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
