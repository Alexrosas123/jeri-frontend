import { useMemo, useState } from 'react';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import {
  actualizarProducto,
  agregarCategoria,
  agregarMarca,
  crearProducto,
  obtenerCatalogo,
  usaEjemplo,
} from '../../services/productos';
import { formatearPesos } from '../../utils/formato';
import { estadoExistencia } from '../../utils/inventario';
import CategoriasMarcas from './CategoriasMarcas';
import ProductoForm from './ProductoForm';
import './Productos.css';

/** Productos · RF-06, RF-07, RF-20 · CU-05 · Jira SCRUM-12 */
export default function Productos() {
  const { datos, setDatos, cargando, error } = useLista(obtenerCatalogo, { productos: [], categorias: [], marcas: [] });
  const { productos, categorias, marcas } = datos;

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [formulario, setFormulario] = useState(null); // null · 'nuevo' · producto a editar
  const [verCatalogos, setVerCatalogos] = useState(false);

  const nombreDe = (lista, id) => lista.find((x) => x.id === id)?.nombre ?? '—';

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      if (categoria && p.categoriaId !== Number(categoria)) return false;
      if (!texto) return true;
      return p.nombre.toLowerCase().includes(texto) || p.sku.toLowerCase().includes(texto);
    });
  }, [productos, busqueda, categoria]);

  // Cambia solo la parte de `datos` que se indica (productos, categorias o marcas)
  const actualizar = (clave, cambio) => setDatos((anterior) => ({ ...anterior, [clave]: cambio(anterior[clave]) }));

  async function guardar(valores) {
    if (formulario === 'nuevo') {
      const nuevo = await crearProducto(valores);
      actualizar('productos', (lista) => [...lista, nuevo]);
      setMensaje(`Se registró el producto ${nuevo.nombre}.`);
    } else {
      const actualizado = await actualizarProducto(formulario.id, valores);
      actualizar('productos', (lista) => lista.map((p) => (p.id === actualizado.id ? actualizado : p)));
      setMensaje(`Se guardaron los cambios de ${actualizado.nombre}.`);
    }
    setFormulario(null);
  }

  return (
    <>
      <PageHeader
        titulo="Productos"
        datosDeEjemplo={usaEjemplo}
        acciones={
          <>
            <Button variante="secundario" onClick={() => setVerCatalogos(true)}>Categorías y marcas</Button>
            <Button onClick={() => setFormulario('nuevo')}>Nuevo producto</Button>
          </>
        }
      />

      {mensaje && <p className="mensaje mensaje--exito" role="status">{mensaje}</p>}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <div className="filtros">
        <label htmlFor="buscar-producto" className="solo-lectores">Buscar producto</label>
        <input
          id="buscar-producto"
          type="search"
          className="campo__input filtros__buscador"
          placeholder="Buscar por nombre o SKU"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <label htmlFor="categoria-producto" className="solo-lectores">Categoría</label>
        <select
          id="categoria-producto"
          className="campo__input filtros__selector"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <Table etiqueta="Catálogo de productos">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Marca</th>
            <th className="celda-numero">Precio</th>
            <th className="celda-numero">Existencia</th>
            <th>Estado</th>
            <th><span className="solo-lectores">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {cargando && <tr><td colSpan={7} className="tabla__vacia">Cargando productos…</td></tr>}
          {!cargando && visibles.length === 0 && (
            <tr>
              <td colSpan={7} className="tabla__vacia">
                {productos.length === 0 ? 'Aún no hay productos registrados.' : 'No hay productos que coincidan con la búsqueda.'}
              </td>
            </tr>
          )}
          {visibles.map((p) => {
            const estado = estadoExistencia(p);
            return (
              <tr key={p.id}>
                <td>
                  <p className="texto-principal">{p.nombre}</p>
                  <p className="texto-secundario texto-mono">{p.sku}</p>
                </td>
                <td className="texto-secundario">{nombreDe(categorias, p.categoriaId)}</td>
                <td className="texto-secundario">{nombreDe(marcas, p.marcaId)}</td>
                <td className="celda-numero texto-mono">{formatearPesos(p.precio)}</td>
                <td className="celda-numero texto-mono">{p.existencia}</td>
                <td><Badge tipo={estado.tipo}>{estado.texto}</Badge></td>
                <td className="celda-accion">
                  <button type="button" className="tabla__accion" onClick={() => setFormulario(p)}>
                    Editar<span className="solo-lectores"> {p.nombre}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {formulario && (
        <ProductoForm
          producto={formulario === 'nuevo' ? null : formulario}
          productos={productos}
          categorias={categorias}
          marcas={marcas}
          alGuardar={guardar}
          alCerrar={() => setFormulario(null)}
        />
      )}

      {verCatalogos && (
        <CategoriasMarcas
          categorias={categorias}
          marcas={marcas}
          alAgregarCategoria={async (nombre) => {
            const nueva = await agregarCategoria(nombre);
            actualizar('categorias', (lista) => [...lista, nueva]);
          }}
          alAgregarMarca={async (nombre) => {
            const nueva = await agregarMarca(nombre);
            actualizar('marcas', (lista) => [...lista, nueva]);
          }}
          alCerrar={() => setVerCatalogos(false)}
        />
      )}
    </>
  );
}
