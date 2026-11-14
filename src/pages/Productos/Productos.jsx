import { useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
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
import { proveedores as servicioProveedores } from '../../services/proveedores';
import { formatearPesos } from '../../utils/formato';
import { estadoProducto, estaVisible } from '../../utils/inventario';
import CategoriasMarcas from './CategoriasMarcas';
import ProductoForm from './ProductoForm';
import './Productos.css';

async function cargarPantalla() {
  const [catalogo, proveedores] = await Promise.all([obtenerCatalogo(), servicioProveedores.listar()]);
  return { ...catalogo, proveedores };
}

/** Productos · RF-06, RF-07, RF-20 · CU-05 · Jira SCRUM-12 */
export default function Productos() {
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();
  const { datos, setDatos, cargando, error } = useLista(cargarPantalla, {
    productos: [],
    categorias: [],
    marcas: [],
    proveedores: [],
  });
  const { categorias, marcas, proveedores } = datos;
  const productos = datos.productos.filter(estaVisible); // los eliminados no se muestran

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [proveedor, setProveedor] = useState(parametros.get('proveedor') ?? ''); // viene de "Ver productos" en Proveedores
  const [estado, setEstado] = useState('todos'); // 'todos' | 'activos' | 'inhabilitados'
  const [mensaje, setMensaje] = useState(ubicacion.state?.mensaje ?? ''); // p. ej. "Se eliminó el producto…"
  const [formulario, setFormulario] = useState(null); // null · 'nuevo' · producto a editar
  const [verCatalogos, setVerCatalogos] = useState(false);

  const nombreDe = (lista, id) => lista.find((x) => x.id === id)?.nombre ?? '—';

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      if (categoria && p.categoriaId !== Number(categoria)) return false;
      if (marca && p.marcaId !== Number(marca)) return false;
      if (proveedor === 'sin' && p.proveedorId) return false;
      if (proveedor && proveedor !== 'sin' && p.proveedorId !== Number(proveedor)) return false;
      if (estado === 'activos' && p.activo === false) return false;
      if (estado === 'inhabilitados' && p.activo !== false) return false;
      if (!texto) return true;
      return p.nombre.toLowerCase().includes(texto) || p.sku.toLowerCase().includes(texto);
    });
  }, [productos, busqueda, categoria, marca, proveedor, estado]);

  const hayFiltros = busqueda || categoria || marca || proveedor || estado !== 'todos';
  function limpiarFiltros() {
    setBusqueda('');
    setCategoria('');
    setMarca('');
    setProveedor('');
    setEstado('todos');
  }

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
        <label htmlFor="marca-producto" className="solo-lectores">Marca</label>
        <select
          id="marca-producto"
          className="campo__input filtros__selector"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
        >
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
        <label htmlFor="proveedor-producto" className="solo-lectores">Proveedor</label>
        <select
          id="proveedor-producto"
          className="campo__input filtros__selector"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
          <option value="sin">Sin proveedor asignado</option>
        </select>
        <label htmlFor="estado-producto" className="solo-lectores">Estado</label>
        <select
          id="estado-producto"
          className="campo__input filtros__selector"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="todos">Activos e inhabilitados</option>
          <option value="activos">Solo activos</option>
          <option value="inhabilitados">Solo inhabilitados</option>
        </select>
        {hayFiltros && (
          <button type="button" className="tabla__accion" onClick={limpiarFiltros}>Quitar filtros</button>
        )}
      </div>

      <Table etiqueta="Catálogo de productos">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Marca · Proveedor</th>
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
                {productos.length === 0 ? 'Aún no hay productos registrados.' : 'No hay productos que coincidan con los filtros.'}
              </td>
            </tr>
          )}
          {visibles.map((p) => {
            const estadoFila = estadoProducto(p);
            return (
              <tr key={p.id} className={p.activo === false ? 'fila--apagada' : undefined}>
                <td>
                  <Link to={`/productos/${p.id}`} className="texto-principal enlace-tabla">{p.nombre}</Link>
                  <p className="texto-secundario texto-mono">{p.sku}</p>
                </td>
                <td className="texto-secundario">{nombreDe(categorias, p.categoriaId)}</td>
                <td>
                  <p className="texto-secundario">{nombreDe(marcas, p.marcaId)}</p>
                  <p className="texto-secundario">{p.proveedorId ? nombreDe(proveedores, p.proveedorId) : 'Sin proveedor'}</p>
                </td>
                <td className="celda-numero texto-mono">{formatearPesos(p.precio)}</td>
                <td className="celda-numero texto-mono">{p.existencia}</td>
                <td><Badge tipo={estadoFila.tipo}>{estadoFila.texto}</Badge></td>
                <td className="celda-accion">
                  <Link to={`/productos/${p.id}`} className="tabla__accion">
                    Ver<span className="solo-lectores"> {p.nombre}</span>
                  </Link>
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
          productos={datos.productos /* incluye eliminados: su SKU no se puede repetir */}
          categorias={categorias}
          marcas={marcas}
          proveedores={proveedores}
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
