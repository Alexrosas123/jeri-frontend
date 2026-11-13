import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import Button, { BotonEnlace } from '../../components/Button/Button';
import KpiCard from '../../components/KpiCard/KpiCard';
import Modal from '../../components/Modal/Modal';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { clientes as servicioClientes } from '../../services/clientes';
import {
  actualizarProducto,
  eliminarProducto,
  obtenerCatalogo,
  obtenerInventario,
  usaEjemplo,
} from '../../services/productos';
import { proveedores as servicioProveedores } from '../../services/proveedores';
import { listarVentas } from '../../services/ventas';
import { formatearFechaHora, formatearPesos } from '../../utils/formato';
import { estadoProducto } from '../../utils/inventario';
import ProductoForm from './ProductoForm';

async function cargarPantalla() {
  const [catalogo, inventario, proveedores, clientes, ventas] = await Promise.all([
    obtenerCatalogo(),
    obtenerInventario(),
    servicioProveedores.listar(),
    servicioClientes.listar(),
    listarVentas(),
  ]);
  return { ...catalogo, movimientos: inventario.movimientos, proveedores, clientes, ventas };
}

const VACIO = { productos: [], categorias: [], marcas: [], movimientos: [], proveedores: [], clientes: [], ventas: [] };

/** Detalle de un producto: datos, ventas, movimientos e inhabilitar / eliminar */
export default function ProductoDetalle() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { datos, setDatos, cargando, error } = useLista(cargarPantalla, VACIO);
  const [editando, setEditando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const producto = datos.productos.find((p) => p.id === Number(id));
  const nombreDe = (lista, idBuscado) => lista.find((x) => x.id === idBuscado)?.nombre ?? '—';

  if (cargando) return <p className="texto-secundario">Cargando producto…</p>;
  if (!producto || producto.eliminado) {
    return (
      <>
        <PageHeader titulo="Producto no encontrado" />
        <p>Este producto no existe o fue eliminado del catálogo.</p>
        <BotonEnlace to="/productos" variante="secundario">← Volver a productos</BotonEnlace>
      </>
    );
  }

  // Ventas de este producto (unidades, importe y quién lo compra más)
  const lineas = datos.ventas.flatMap((v) =>
    v.lineas.filter((l) => l.productoId === producto.id).map((l) => ({ ...l, clienteId: v.clienteId })),
  );
  const unidadesVendidas = lineas.reduce((s, l) => s + l.cantidad, 0);
  const importeVendido = lineas.reduce((s, l) => s + l.cantidad * l.precio, 0);
  const porCliente = new Map();
  for (const l of lineas) porCliente.set(l.clienteId, (porCliente.get(l.clienteId) ?? 0) + l.cantidad);
  const mejoresClientes = [...porCliente.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const movimientos = datos.movimientos
    .filter((m) => m.productoId === producto.id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10);

  const estado = estadoProducto(producto);
  const activo = producto.activo !== false;

  const reemplazar = (actualizado) =>
    setDatos((anterior) => ({ ...anterior, productos: anterior.productos.map((p) => (p.id === actualizado.id ? actualizado : p)) }));

  async function guardarEdicion(valores) {
    const actualizado = await actualizarProducto(producto.id, valores);
    reemplazar(actualizado);
    setEditando(false);
    setMensaje({ tipo: 'exito', texto: 'Se guardaron los cambios del producto.' });
  }

  async function cambiarActivo() {
    setTrabajando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const { nombre, sku, categoriaId, marcaId, proveedorId, precio, stockMinimo } = producto;
      const actualizado = await actualizarProducto(producto.id, {
        nombre, sku, categoriaId, marcaId, proveedorId, precio, stockMinimo, activo: !activo,
      });
      reemplazar(actualizado);
      setMensaje({
        tipo: 'exito',
        texto: activo
          ? 'El producto quedó inhabilitado: ya no aparece en compras, ventas ni cotizaciones.'
          : 'El producto se habilitó de nuevo.',
      });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setTrabajando(false);
    }
  }

  async function eliminar() {
    setTrabajando(true);
    try {
      await eliminarProducto(producto.id);
      navegar('/productos', { state: { mensaje: `Se eliminó el producto ${producto.nombre}. Su historial se conserva.` } });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
      setTrabajando(false);
      setConfirmarEliminar(false);
    }
  }

  return (
    <>
      <div className="detalle__volver">
        <BotonEnlace to="/productos" variante="secundario">← Volver a productos</BotonEnlace>
      </div>

      <PageHeader
        titulo={producto.nombre}
        descripcion={`SKU ${producto.sku}`}
        datosDeEjemplo={usaEjemplo}
        acciones={<Button onClick={() => setEditando(true)}>Editar producto</Button>}
      />

      {mensaje.texto && (
        <p className={`mensaje mensaje--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>{mensaje.texto}</p>
      )}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <section className="detalle__indicadores" aria-label="Resumen del producto">
        <KpiCard etiqueta="Existencia" valor={producto.existencia} tono={estado.tipo === 'ok' ? 'normal' : 'alerta'} to="/inventario" />
        <KpiCard etiqueta="Precio de venta" valor={formatearPesos(producto.precio)} />
        <KpiCard etiqueta="Unidades vendidas" valor={unidadesVendidas} />
        <KpiCard etiqueta="Importe vendido" valor={formatearPesos(importeVendido)} />
      </section>

      <section className="detalle__tarjeta" aria-labelledby="titulo-datos-producto">
        <h2 id="titulo-datos-producto">Datos del producto</h2>
        <dl className="detalle__datos">
          <div><dt>Categoría</dt><dd>{nombreDe(datos.categorias, producto.categoriaId)}</dd></div>
          <div><dt>Marca</dt><dd>{nombreDe(datos.marcas, producto.marcaId)}</dd></div>
          <div>
            <dt>Proveedor principal</dt>
            <dd>
              {producto.proveedorId ? (
                <Link to={`/productos?proveedor=${producto.proveedorId}`}>{nombreDe(datos.proveedores, producto.proveedorId)}</Link>
              ) : (
                'Sin proveedor asignado'
              )}
            </dd>
          </div>
          <div><dt>Stock mínimo</dt><dd>{producto.stockMinimo}</dd></div>
          <div><dt>Estado</dt><dd><Badge tipo={estado.tipo}>{estado.texto}</Badge></dd></div>
        </dl>
      </section>

      <div className="detalle__columnas">
        <section className="detalle__seccion" aria-labelledby="titulo-movimientos-producto">
          <h2 id="titulo-movimientos-producto">Últimos movimientos</h2>
          <Table etiqueta="Últimos movimientos del producto">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Movimiento</th>
                <th className="celda-numero">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length === 0 && (
                <tr><td colSpan={3} className="tabla__vacia">Aún no hay movimientos de este producto.</td></tr>
              )}
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td className="texto-secundario">{formatearFechaHora(m.fecha)}</td>
                  <td>
                    {m.tipo === 'entrada' ? 'Entrada' : 'Salida'} · {m.motivo}
                    {m.nota && <p className="texto-secundario texto-mono">{m.nota}</p>}
                  </td>
                  <td className="celda-numero texto-mono">{m.tipo === 'entrada' ? '+' : '−'}{m.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        <section className="detalle__seccion" aria-labelledby="titulo-clientes-producto">
          <h2 id="titulo-clientes-producto">Clientes que más lo compran</h2>
          <Table etiqueta="Clientes que más compran el producto">
            <thead>
              <tr>
                <th>Cliente</th>
                <th className="celda-numero">Unidades</th>
              </tr>
            </thead>
            <tbody>
              {mejoresClientes.length === 0 && (
                <tr><td colSpan={2} className="tabla__vacia">Este producto aún no se ha vendido.</td></tr>
              )}
              {mejoresClientes.map(([clienteId, unidades]) => (
                <tr key={clienteId}>
                  <td><Link to={`/clientes/${clienteId}`} className="texto-principal enlace-tabla">{nombreDe(datos.clientes, clienteId)}</Link></td>
                  <td className="celda-numero texto-mono">{unidades}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      </div>

      <section className="detalle__peligro" aria-label="Inhabilitar o eliminar">
        <p className="texto-secundario">
          {activo
            ? 'Inhabilítalo si por ahora no se debe comprar ni vender. Elimínalo si ya no se va a manejar.'
            : 'Este producto está inhabilitado: no aparece en compras, ventas ni cotizaciones.'}
        </p>
        <div className="detalle__peligro-acciones">
          <Button variante="secundario" onClick={cambiarActivo} disabled={trabajando}>
            {activo ? 'Inhabilitar producto' : 'Habilitar producto'}
          </Button>
          <Button variante="secundario" className="boton--peligro" onClick={() => setConfirmarEliminar(true)} disabled={trabajando}>
            Eliminar producto
          </Button>
        </div>
      </section>

      {editando && (
        <ProductoForm
          producto={producto}
          productos={datos.productos}
          categorias={datos.categorias}
          marcas={datos.marcas}
          proveedores={datos.proveedores}
          alGuardar={guardarEdicion}
          alCerrar={() => setEditando(false)}
        />
      )}

      {confirmarEliminar && (
        <Modal
          abierto
          titulo="¿Eliminar este producto?"
          alCerrar={() => setConfirmarEliminar(false)}
          acciones={
            <>
              <Button variante="secundario" onClick={() => setConfirmarEliminar(false)}>Cancelar</Button>
              <Button className="boton--eliminar" onClick={eliminar} disabled={trabajando}>
                {trabajando ? 'Eliminando…' : 'Sí, eliminar'}
              </Button>
            </>
          }
        >
          <div className="formulario">
            <p>
              <strong>{producto.nombre}</strong> dejará de aparecer en el catálogo, en inventario y en las ventanas
              para comprar o vender.
            </p>
            <p className="formulario__nota">
              No se borra su historial: las ventas, compras y movimientos anteriores lo siguen mostrando.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
