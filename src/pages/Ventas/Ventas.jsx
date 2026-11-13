import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BuscadorProductos from '../../components/BuscadorProductos/BuscadorProductos';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { clientes, direccionesDe } from '../../services/clientes';
import { obtenerInventario } from '../../services/productos';
import { listarVentas, registrarVenta, usaEjemplo } from '../../services/ventas';
import { formatearFecha, formatearPesos, totalDeLineas } from '../../utils/formato';
import { estaDisponible } from '../../utils/inventario';

async function cargarPantalla() {
  const [listaClientes, inventario, ventas] = await Promise.all([clientes.listar(), obtenerInventario(), listarVentas()]);
  return { clientes: listaClientes, productos: inventario.productos, ventas };
}

/** Si venimos de "Convertir en venta" (Cotizaciones), la venta empieza con esos datos. */
function formularioInicial(cotizacion) {
  if (!cotizacion) return { clienteId: '', direccion: null, lineas: [], cotizacion: null };
  return {
    clienteId: String(cotizacion.clienteId),
    direccion: null, // null = la primera dirección del cliente
    lineas: cotizacion.lineas.map((l) => ({ ...l, cantidad: String(l.cantidad) })),
    cotizacion: { id: cotizacion.id, folio: cotizacion.folio },
  };
}

/** Registrar venta · RF-14, RF-15 */
export default function Ventas() {
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const { datos, setDatos, cargando, error } = useLista(cargarPantalla, { clientes: [], productos: [], ventas: [] });
  const [formulario, setFormulario] = useState(() => formularioInicial(ubicacion.state?.cotizacion));
  const [errores, setErrores] = useState({});
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const activos = datos.clientes.filter((c) => c.activo || String(c.id) === formulario.clienteId);
  const producto = (id) => datos.productos.find((p) => p.id === id);
  const nombreCliente = (id) => datos.clientes.find((c) => c.id === id)?.nombre ?? 'Cliente';
  // Direcciones de entrega del cliente elegido; si no se ha escogido una, se usa la primera
  const direcciones = direccionesDe(datos.clientes.find((c) => String(c.id) === formulario.clienteId));
  const direccionElegida = formulario.direccion ?? direcciones[0] ?? '';
  // En el formulario la cantidad es texto (lo que escribe el usuario); para sumar la convertimos a número
  const lineasNumericas = formulario.lineas.map((l) => ({ ...l, cantidad: Number(l.cantidad) || 0 }));
  const total = totalDeLineas(lineasNumericas);

  function limpiar() {
    setFormulario(formularioInicial(null));
    setErrores({});
    if (ubicacion.state) navegar('.', { replace: true, state: null }); // olvidar la cotización de origen
  }

  function agregarSeleccion(seleccion) {
    setFormulario((anterior) => {
      let lineas = [...anterior.lineas];
      for (const [id, cantidad] of Object.entries(seleccion)) {
        const productoId = Number(id);
        const existente = lineas.find((l) => l.productoId === productoId);
        if (existente) {
          lineas = lineas.map((l) => (l === existente ? { ...l, cantidad: String(Number(l.cantidad) + cantidad) } : l));
        } else {
          lineas.push({ productoId, cantidad: String(cantidad), precio: producto(productoId).precio });
        }
      }
      return { ...anterior, lineas };
    });
    setErrores((anterior) => ({ ...anterior, lineas: undefined }));
    setBuscando(false);
  }

  function cambiarCantidad(productoId, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      lineas: anterior.lineas.map((l) => (l.productoId === productoId ? { ...l, cantidad: valor } : l)),
    }));
    setErrores((anterior) => ({ ...anterior, [`linea-${productoId}`]: undefined }));
  }

  function quitarLinea(productoId) {
    setFormulario((anterior) => ({ ...anterior, lineas: anterior.lineas.filter((l) => l.productoId !== productoId) }));
  }

  function validar() {
    const e = {};
    if (!formulario.clienteId) e.clienteId = 'Selecciona el cliente.';
    if (formulario.lineas.length === 0) e.lineas = 'Agrega al menos un producto.';
    for (const l of lineasNumericas) {
      const p = producto(l.productoId);
      if (!Number.isInteger(l.cantidad) || l.cantidad <= 0) e[`linea-${l.productoId}`] = 'Cantidad inválida.';
      else if (p && l.cantidad > p.existencia) e[`linea-${l.productoId}`] = `Solo hay ${p.existencia}.`;
    }
    return e;
  }

  async function confirmar() {
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) {
      setMensaje({ tipo: 'error', texto: 'Revisa los datos marcados antes de confirmar la venta.' });
      return;
    }

    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const venta = await registrarVenta({
        clienteId: Number(formulario.clienteId),
        lineas: lineasNumericas,
        cotizacionId: formulario.cotizacion?.id,
        direccionEntrega: direccionElegida,
      });
      const { productos } = await obtenerInventario();
      setDatos((anterior) => ({ ...anterior, productos, ventas: [venta, ...anterior.ventas] }));
      limpiar();
      setMensaje({ tipo: 'exito', texto: `Se registró la venta ${venta.folio} por ${formatearPesos(venta.total)}. El inventario ya se actualizó.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  const enLista = Object.fromEntries(lineasNumericas.map((l) => [l.productoId, l.cantidad]));

  return (
    <>
      <PageHeader titulo="Registrar venta" datosDeEjemplo={usaEjemplo} />

      {mensaje.texto && (
        <p className={`mensaje mensaje--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      {formulario.cotizacion && (
        <p className="operacion__aviso-origen">
          Venta a partir de la cotización <strong className="texto-mono">{formulario.cotizacion.folio}</strong>.
          <button type="button" className="tabla__accion" onClick={limpiar}>Descartar</button>
        </p>
      )}

      <section className="tabla operacion" aria-label="Nueva venta">
        <div className="operacion__cabecera">
          <Field
            etiqueta="Cliente"
            opciones={activos.map((c) => ({ valor: String(c.id), texto: c.nombre }))}
            placeholderOpcion={cargando ? 'Cargando clientes…' : 'Seleccionar cliente'}
            value={formulario.clienteId}
            onChange={(e) => {
              setFormulario((anterior) => ({ ...anterior, clienteId: e.target.value, direccion: null }));
              setErrores((anterior) => ({ ...anterior, clienteId: undefined }));
            }}
            error={errores.clienteId}
          />
          {formulario.clienteId && (
            <Field
              etiqueta="Dirección de entrega"
              opciones={direcciones.map((d) => ({ valor: d, texto: d }))}
              placeholderOpcion="Recoge en mostrador (sin envío)"
              value={direccionElegida}
              onChange={(e) => setFormulario((anterior) => ({ ...anterior, direccion: e.target.value }))}
            />
          )}
        </div>

        <div className="tabla__desplazable">
          <table aria-label="Productos de la venta">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="celda-numero">Cantidad</th>
                <th className="celda-numero">Importe</th>
                <th><span className="solo-lectores">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              {formulario.lineas.length === 0 && (
                <tr>
                  <td colSpan={4} className="tabla__vacia">
                    {errores.lineas ? <span className="campo__error">{errores.lineas}</span> : 'Agrega los productos que se van a vender.'}
                  </td>
                </tr>
              )}
              {formulario.lineas.map((l) => {
                const p = producto(l.productoId);
                const errorLinea = errores[`linea-${l.productoId}`];
                return (
                  <tr key={l.productoId}>
                    <td>
                      <p className="texto-principal">{p?.nombre ?? 'Producto'}</p>
                      <p className="texto-secundario">
                        {formatearPesos(l.precio)} c/u · Disponibles: {p?.existencia ?? '—'}
                      </p>
                    </td>
                    <td className="celda-numero">
                      <label htmlFor={`cantidad-${l.productoId}`} className="solo-lectores">Cantidad de {p?.nombre}</label>
                      <input
                        id={`cantidad-${l.productoId}`}
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        className={`campo__input operacion__cantidad ${errorLinea ? 'campo__input--error' : ''}`}
                        value={l.cantidad}
                        onChange={(e) => cambiarCantidad(l.productoId, e.target.value)}
                        aria-invalid={Boolean(errorLinea)}
                      />
                      {errorLinea && <p className="campo__error">{errorLinea}</p>}
                    </td>
                    <td className="celda-numero texto-mono">{formatearPesos((Number(l.cantidad) || 0) * l.precio)}</td>
                    <td className="celda-accion">
                      <button
                        type="button"
                        className="operacion__quitar"
                        onClick={() => quitarLinea(l.productoId)}
                        aria-label={`Quitar ${p?.nombre ?? 'producto'}`}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="operacion__agregar">
          <Button variante="secundario" onClick={() => setBuscando(true)} disabled={cargando}>+ Agregar producto</Button>
        </div>

        <div className="operacion__pie">
          <div>
            <span className="operacion__total-etiqueta">Total (IVA incluido)</span>
            <span className="operacion__total">{formatearPesos(total)}</span>
          </div>
          <div className="operacion__pie-acciones">
            <button type="button" className="tabla__accion" onClick={limpiar} disabled={guardando}>Cancelar</button>
            <Button onClick={confirmar} disabled={guardando || cargando}>
              {guardando ? 'Registrando…' : 'Confirmar venta'}
            </Button>
          </div>
        </div>
      </section>

      <p className="formulario__nota">Al confirmar, las existencias se descuentan del inventario automáticamente.</p>

      <h2 className="subtitulo-seccion">Ventas recientes</h2>
      <Table etiqueta="Ventas recientes">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th className="celda-numero">Total</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          {cargando && <tr><td colSpan={5} className="tabla__vacia">Cargando ventas…</td></tr>}
          {!cargando && datos.ventas.length === 0 && (
            <tr><td colSpan={5} className="tabla__vacia">Aún no hay ventas registradas.</td></tr>
          )}
          {datos.ventas.map((v) => (
            <tr key={v.id}>
              <td className="texto-mono">{v.folio}</td>
              <td className="texto-principal">{nombreCliente(v.clienteId)}</td>
              <td className="texto-secundario">{formatearFecha(v.fecha)}</td>
              <td className="celda-numero texto-mono">{formatearPesos(v.total)}</td>
              <td className="texto-secundario">{v.cotizacionId ? 'Desde cotización' : 'Directa'}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {buscando && (
        <BuscadorProductos
          productos={datos.productos.filter(estaDisponible)}
          enLista={enLista}
          validarExistencia
          alTerminar={agregarSeleccion}
          alCerrar={() => setBuscando(false)}
        />
      )}
    </>
  );
}
