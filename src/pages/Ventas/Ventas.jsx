import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import BuscadorProductos from '../../components/BuscadorProductos/BuscadorProductos';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { clientes, direccionesDe } from '../../services/clientes';
import { obtenerInventario } from '../../services/productos';
import { aplicarDescuento, listarPromociones, mejorPromocion } from '../../services/promociones';
import { listarVentas, registrarVenta, usaEjemplo } from '../../services/ventas';
import { formatearFecha, formatearPesos, totalDeLineas } from '../../utils/formato';
import { estaDisponible } from '../../utils/inventario';

async function cargarPantalla() {
  const [listaClientes, inventario, ventas, promociones] = await Promise.all([
    clientes.listar(),
    obtenerInventario(),
    listarVentas(),
    listarPromociones(),
  ]);
  return { clientes: listaClientes, productos: inventario.productos, ventas, promociones };
}

/** Si venimos de "Convertir en venta" (Cotizaciones), la venta empieza con esos datos. */
function formularioInicial(cotizacion) {
  if (!cotizacion) return { tipo: 'normal', clienteId: '', direccion: null, lineas: [], cotizacion: null };
  return {
    tipo: 'normal',
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
  const { datos, setDatos, cargando, error } = useLista(cargarPantalla, { clientes: [], productos: [], ventas: [], promociones: [] });
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
  // En el formulario la cantidad es texto y `precio` es el precio de lista.
  // Aquí se calcula cada línea con número, descuento (si es venta con promoción) y precio final.
  const conPromocion = formulario.tipo === 'promocion';
  const lineasNumericas = formulario.lineas.map((l) => {
    const promocion = conPromocion ? mejorPromocion(datos.promociones, Number(formulario.clienteId), l.productoId) : null;
    const descuento = promocion?.porcentaje ?? 0;
    return {
      productoId: l.productoId,
      cantidad: Number(l.cantidad) || 0,
      precioLista: l.precio,
      descuento,
      promocionId: promocion?.id ?? null,
      precio: aplicarDescuento(l.precio, descuento),
      promocion,
    };
  });
  const total = totalDeLineas(lineasNumericas);
  const subtotal = lineasNumericas.reduce((s, l) => s + l.cantidad * l.precioLista, 0);
  const ahorro = Math.round((subtotal - total) * 100) / 100;
  const ningunaAplica = conPromocion && Boolean(formulario.clienteId) && lineasNumericas.length > 0 && ahorro === 0;
  const calculada = (productoId) => lineasNumericas.find((l) => l.productoId === productoId);

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
        lineas: lineasNumericas.map((l) => {
          const linea = { ...l };
          delete linea.promocion; // `promocion` solo sirve para mostrarla en pantalla
          return linea;
        }),
        cotizacionId: formulario.cotizacion?.id,
        direccionEntrega: direccionElegida,
      });
      const { productos } = await obtenerInventario();
      setDatos((anterior) => ({ ...anterior, productos, ventas: [venta, ...anterior.ventas] }));
      limpiar();
      const detalle = venta.tipo === 'promocion' ? ` con promoción (descuento de ${formatearPesos(venta.descuentoTotal)})` : '';
      setMensaje({
        tipo: 'exito',
        texto: `Se registró la venta ${venta.folio}${detalle} por ${formatearPesos(venta.total)}. El inventario ya se actualizó.`,
      });
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

        <fieldset className="operacion__tipo">
          <legend className="campo__etiqueta">Tipo de venta</legend>
          <div className="segmentado">
            {[
              ['normal', 'Venta normal'],
              ['promocion', 'Venta con promoción'],
            ].map(([valor, texto]) => (
              <label key={valor} className={`segmentado__opcion ${formulario.tipo === valor ? 'segmentado__opcion--activa' : ''}`}>
                <input
                  type="radio"
                  name="tipo-venta"
                  value={valor}
                  checked={formulario.tipo === valor}
                  onChange={() => setFormulario((anterior) => ({ ...anterior, tipo: valor }))}
                />
                {texto}
              </label>
            ))}
          </div>
          <p className="formulario__nota" aria-live="polite">
            {!conPromocion && 'Se cobra el precio de lista.'}
            {conPromocion && !ningunaAplica && 'Se aplican automáticamente las promociones vigentes para este cliente y estos productos.'}
            {ningunaAplica && 'Ninguna promoción vigente aplica a este cliente y estos productos: se registrará como venta normal.'}
          </p>
        </fieldset>

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
                const c = calculada(l.productoId);
                const errorLinea = errores[`linea-${l.productoId}`];
                return (
                  <tr key={l.productoId}>
                    <td>
                      <p className="texto-principal">{p?.nombre ?? 'Producto'}</p>
                      <p className="texto-secundario">
                        {c.descuento > 0 && <s className="precio-anterior">{formatearPesos(c.precioLista)}</s>}{' '}
                        {formatearPesos(c.precio)} c/u · Disponibles: {p?.existencia ?? '—'}
                      </p>
                      {c.promocion && (
                        <p className="texto-secundario">
                          <Badge tipo="info">−{c.descuento} %</Badge> {c.promocion.nombre}
                        </p>
                      )}
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
                    <td className="celda-numero texto-mono">{formatearPesos(c.cantidad * c.precio)}</td>
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
            {ahorro > 0 && (
              <p className="operacion__desglose">
                Subtotal {formatearPesos(subtotal)} · Descuento <strong>−{formatearPesos(ahorro)}</strong>
              </p>
            )}
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
            <th>Tipo</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          {cargando && <tr><td colSpan={6} className="tabla__vacia">Cargando ventas…</td></tr>}
          {!cargando && datos.ventas.length === 0 && (
            <tr><td colSpan={6} className="tabla__vacia">Aún no hay ventas registradas.</td></tr>
          )}
          {[...datos.ventas]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 10)
            .map((v) => (
              <tr key={v.id}>
                <td className="texto-mono">{v.folio}</td>
                <td className="texto-principal">{nombreCliente(v.clienteId)}</td>
                <td className="texto-secundario">{formatearFecha(v.fecha)}</td>
                <td className="celda-numero texto-mono">{formatearPesos(v.total)}</td>
                <td>
                  {v.tipo === 'promocion' ? <Badge tipo="info">Con promoción</Badge> : <Badge tipo="neutro">Normal</Badge>}
                </td>
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
