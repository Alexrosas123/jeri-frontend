import { useState } from 'react';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { listarCompras, marcarRecibida, registrarCompra, usaEjemplo } from '../../services/compras';
import { obtenerInventario } from '../../services/productos';
import { proveedores } from '../../services/proveedores';
import { formatearFecha, formatearPesos, totalDeLineas } from '../../utils/formato';
import { estaDisponible } from '../../utils/inventario';
import LineaCompraForm from './LineaCompraForm';

async function cargarPantalla() {
  const [listaProveedores, inventario, compras] = await Promise.all([
    proveedores.listar(),
    obtenerInventario(),
    listarCompras(),
  ]);
  return { proveedores: listaProveedores, productos: inventario.productos, compras };
}

const FORMULARIO_VACIO = { proveedorId: '', lineas: [], recibida: true };

/** Registrar compra · RF-11, RF-13 */
export default function Compras() {
  const { datos, setDatos, cargando, error } = useLista(cargarPantalla, { proveedores: [], productos: [], compras: [] });
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [agregando, setAgregando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const activos = datos.proveedores.filter((p) => p.activo);
  const nombreProducto = (id) => datos.productos.find((p) => p.id === id)?.nombre ?? 'Producto';
  const nombreProveedor = (id) => datos.proveedores.find((p) => p.id === id)?.nombre ?? 'Proveedor';
  const total = totalDeLineas(formulario.lineas);

  function agregarLinea(nueva) {
    setFormulario((anterior) => {
      const existente = anterior.lineas.find((l) => l.productoId === nueva.productoId);
      // Si el producto ya estaba, se suman las cantidades y se usa el costo nuevo
      const lineas = existente
        ? anterior.lineas.map((l) => (l === existente ? { ...l, cantidad: l.cantidad + nueva.cantidad, precio: nueva.precio } : l))
        : [...anterior.lineas, nueva];
      return { ...anterior, lineas };
    });
    setErrores((anterior) => ({ ...anterior, lineas: undefined }));
    setAgregando(false);
  }

  function quitarLinea(productoId) {
    setFormulario((anterior) => ({ ...anterior, lineas: anterior.lineas.filter((l) => l.productoId !== productoId) }));
  }

  async function confirmar() {
    const e = {};
    if (!formulario.proveedorId) e.proveedorId = 'Selecciona el proveedor.';
    if (formulario.lineas.length === 0) e.lineas = 'Agrega al menos un producto.';
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const compra = await registrarCompra({
        proveedorId: Number(formulario.proveedorId),
        lineas: formulario.lineas,
        recibida: formulario.recibida,
      });
      // Volvemos a pedir el inventario porque las existencias pudieron cambiar
      const { productos } = await obtenerInventario();
      setDatos((anterior) => ({ ...anterior, productos, compras: [compra, ...anterior.compras] }));
      setFormulario(FORMULARIO_VACIO);
      setMensaje({
        tipo: 'exito',
        texto: compra.recibida
          ? `Se registró la compra ${compra.folio} y sus productos se sumaron al inventario.`
          : `Se registró la compra ${compra.folio}. Queda pendiente de recibir.`,
      });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  async function recibir(compra) {
    setMensaje({ tipo: '', texto: '' });
    try {
      const actualizada = await marcarRecibida(compra.id);
      const { productos } = await obtenerInventario();
      setDatos((anterior) => ({
        ...anterior,
        productos,
        compras: anterior.compras.map((c) => (c.id === compra.id ? actualizada : c)),
      }));
      setMensaje({ tipo: 'exito', texto: `La compra ${compra.folio} se marcó como recibida y se sumó al inventario.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  }

  return (
    <>
      <PageHeader titulo="Registrar compra" datosDeEjemplo={usaEjemplo} />

      {mensaje.texto && (
        <p className={`mensaje mensaje--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <section className="tabla operacion" aria-label="Nueva compra">
        <div className="operacion__cabecera">
          <Field
            etiqueta="Proveedor"
            opciones={activos.map((p) => ({ valor: String(p.id), texto: p.nombre }))}
            placeholderOpcion={cargando ? 'Cargando proveedores…' : 'Seleccionar proveedor'}
            value={formulario.proveedorId}
            onChange={(e) => {
              setFormulario((anterior) => ({ ...anterior, proveedorId: e.target.value }));
              setErrores((anterior) => ({ ...anterior, proveedorId: undefined }));
            }}
            error={errores.proveedorId}
          />
        </div>

        <div className="tabla__desplazable">
          <table aria-label="Productos de la compra">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="celda-numero">Cantidad</th>
                <th className="celda-numero">Costo unitario</th>
                <th className="celda-numero">Costo total</th>
                <th><span className="solo-lectores">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              {formulario.lineas.length === 0 && (
                <tr>
                  <td colSpan={5} className="tabla__vacia">
                    {errores.lineas ? <span className="campo__error">{errores.lineas}</span> : 'Agrega los productos que vas a comprar.'}
                  </td>
                </tr>
              )}
              {formulario.lineas.map((l) => (
                <tr key={l.productoId}>
                  <td className="texto-principal">{nombreProducto(l.productoId)}</td>
                  <td className="celda-numero texto-mono">{l.cantidad}</td>
                  <td className="celda-numero texto-mono">{formatearPesos(l.precio)}</td>
                  <td className="celda-numero texto-mono">{formatearPesos(l.cantidad * l.precio)}</td>
                  <td className="celda-accion">
                    <button
                      type="button"
                      className="operacion__quitar"
                      onClick={() => quitarLinea(l.productoId)}
                      aria-label={`Quitar ${nombreProducto(l.productoId)}`}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="operacion__agregar">
          <Button variante="secundario" onClick={() => setAgregando(true)} disabled={cargando}>+ Agregar producto</Button>
        </div>

        <div className="operacion__pie">
          <label className="formulario__casilla">
            <input
              type="checkbox"
              checked={formulario.recibida}
              onChange={(e) => setFormulario((anterior) => ({ ...anterior, recibida: e.target.checked }))}
            />
            Mercancía recibida
          </label>
          <div className="operacion__pie-acciones">
            <span className="operacion__total" aria-label={`Total de la compra: ${formatearPesos(total)}`}>
              {formatearPesos(total)}
            </span>
            <Button onClick={confirmar} disabled={guardando || cargando}>
              {guardando ? 'Registrando…' : 'Confirmar compra'}
            </Button>
          </div>
        </div>
      </section>

      <p className="formulario__nota">
        Con “Mercancía recibida”, las cantidades se suman al inventario al confirmar. Si la mercancía llega después,
        márcala como recibida en la lista de abajo.
      </p>

      <h2 className="subtitulo-seccion">Compras recientes</h2>
      <Table etiqueta="Compras recientes">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Proveedor</th>
            <th>Fecha</th>
            <th className="celda-numero">Total</th>
            <th>Estado</th>
            <th><span className="solo-lectores">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {cargando && <tr><td colSpan={6} className="tabla__vacia">Cargando compras…</td></tr>}
          {!cargando && datos.compras.length === 0 && (
            <tr><td colSpan={6} className="tabla__vacia">Aún no hay compras registradas.</td></tr>
          )}
          {datos.compras.map((c) => (
            <tr key={c.id}>
              <td className="texto-mono">{c.folio}</td>
              <td className="texto-principal">{nombreProveedor(c.proveedorId)}</td>
              <td className="texto-secundario">{formatearFecha(c.fecha)}</td>
              <td className="celda-numero texto-mono">{formatearPesos(c.total)}</td>
              <td>{c.recibida ? <Badge tipo="ok">Recibida</Badge> : <Badge tipo="alerta">Por recibir</Badge>}</td>
              <td className="celda-accion">
                {!c.recibida && (
                  <button type="button" className="tabla__accion" onClick={() => recibir(c)}>
                    Marcar recibida<span className="solo-lectores"> {c.folio}</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {agregando && (
        <LineaCompraForm productos={datos.productos.filter(estaDisponible)} alAgregar={agregarLinea} alCerrar={() => setAgregando(false)} />
      )}
    </>
  );
}
