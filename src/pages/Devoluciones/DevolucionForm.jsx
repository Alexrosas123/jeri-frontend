import { useState } from 'react';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import Modal from '../../components/Modal/Modal';
import { MOTIVOS_DEVOLUCION, yaDevuelto } from '../../services/devoluciones';
import { formatearFecha, formatearPesos } from '../../utils/formato';

/** Ventana "Nueva devolución": venta, piezas que regresan, motivo y si vuelven al inventario */
export default function DevolucionForm({ ventas, devoluciones, clientes, productos, alGuardar, alCerrar }) {
  const [ventaId, setVentaId] = useState('');
  const [cantidades, setCantidades] = useState({}); // { productoId: texto }
  const [motivo, setMotivo] = useState('');
  const [regresarInventario, setRegresarInventario] = useState(true);
  const [nota, setNota] = useState('');
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  const nombreCliente = (id) => clientes.find((c) => c.id === id)?.nombre ?? 'Cliente';
  const nombreProducto = (id) => productos.find((p) => p.id === id)?.nombre ?? 'Producto';

  // Para cada venta: cuántas piezas quedan por devolver de cada producto
  const pendientes = (venta) => {
    const devuelto = yaDevuelto(devoluciones, venta.id);
    return venta.lineas.map((l) => ({ ...l, devueltas: devuelto[l.productoId] ?? 0, disponibles: l.cantidad - (devuelto[l.productoId] ?? 0) }));
  };
  const ventasConPendientes = [...ventas]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .filter((v) => pendientes(v).some((l) => l.disponibles > 0));

  const venta = ventas.find((v) => v.id === Number(ventaId));
  const lineas = venta ? pendientes(venta) : [];
  const aDevolver = lineas
    .map((l) => ({ ...l, aDevolver: Number(cantidades[l.productoId] ?? 0) }))
    .filter((l) => l.aDevolver !== 0 || cantidades[l.productoId]);
  const reembolso = aDevolver.reduce((s, l) => s + (Number.isFinite(l.aDevolver) ? l.aDevolver * l.precio : 0), 0);

  function elegirVenta(valor) {
    setVentaId(valor);
    setCantidades({});
    setErrores({});
  }

  function elegirMotivo(valor) {
    setMotivo(valor);
    setErrores((anterior) => ({ ...anterior, motivo: undefined }));
    // Lo dañado o caducado normalmente ya no se puede volver a vender
    if (valor === 'Producto dañado' || valor === 'Producto caducado') setRegresarInventario(false);
    else if (valor) setRegresarInventario(true);
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    const e = {};
    if (!venta) e.venta = 'Selecciona la venta.';
    if (!motivo) e.motivo = 'Selecciona el motivo.';
    for (const l of aDevolver) {
      if (!Number.isInteger(l.aDevolver) || l.aDevolver < 0) e[l.productoId] = 'Cantidad inválida.';
      else if (l.aDevolver > l.disponibles) e[l.productoId] = `Máximo ${l.disponibles}.`;
    }
    const conPiezas = aDevolver.filter((l) => l.aDevolver > 0);
    if (venta && conPiezas.length === 0 && Object.keys(e).length === 0) e.lineas = 'Escribe cuántas piezas regresan de al menos un producto.';
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await alGuardar({
        venta,
        motivo,
        regresarInventario,
        nota: nota.trim(),
        lineas: conPiezas.map((l) => ({ productoId: l.productoId, cantidad: l.aDevolver, precio: l.precio })),
      });
    } catch (err) {
      setErrorGeneral(err.message);
      setGuardando(false);
    }
  }

  return (
    <Modal
      abierto
      amplio
      titulo="Nueva devolución"
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={alCerrar}>Cancelar</Button>
          <Button type="submit" form="formulario-devolucion" disabled={guardando}>
            {guardando ? 'Registrando…' : 'Registrar devolución'}
          </Button>
        </>
      }
    >
      <form id="formulario-devolucion" className="formulario" onSubmit={alEnviar} noValidate>
        <Field
          etiqueta="Venta"
          opciones={ventasConPendientes.map((v) => ({
            valor: String(v.id),
            texto: `${v.folio} · ${nombreCliente(v.clienteId)} · ${formatearFecha(v.fecha)} · ${formatearPesos(v.total)}`,
          }))}
          placeholderOpcion="Seleccionar venta"
          value={ventaId}
          onChange={(e) => elegirVenta(e.target.value)}
          error={errores.venta}
        />

        {venta && (
          <div className="tabla">
            <div className="tabla__desplazable">
              <table aria-label="Productos de la venta a devolver">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="celda-numero">Vendidas</th>
                    <th className="celda-numero">Ya devueltas</th>
                    <th className="celda-numero">Precio pagado</th>
                    <th className="celda-numero">A devolver</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l) => (
                    <tr key={l.productoId}>
                      <td className="texto-principal">{nombreProducto(l.productoId)}</td>
                      <td className="celda-numero texto-mono">{l.cantidad}</td>
                      <td className="celda-numero texto-mono">{l.devueltas}</td>
                      <td className="celda-numero texto-mono">{formatearPesos(l.precio)}</td>
                      <td className="celda-numero">
                        <label htmlFor={`devolver-${l.productoId}`} className="solo-lectores">Piezas a devolver de {nombreProducto(l.productoId)}</label>
                        <input
                          id={`devolver-${l.productoId}`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max={l.disponibles}
                          step="1"
                          disabled={l.disponibles === 0}
                          className={`campo__input operacion__cantidad ${errores[l.productoId] ? 'campo__input--error' : ''}`}
                          value={cantidades[l.productoId] ?? ''}
                          placeholder="0"
                          onChange={(e) => {
                            setCantidades((anterior) => ({ ...anterior, [l.productoId]: e.target.value }));
                            setErrores((anterior) => ({ ...anterior, [l.productoId]: undefined, lineas: undefined }));
                          }}
                        />
                        {errores[l.productoId] && <p className="campo__error">{errores[l.productoId]}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {errores.lineas && <p className="campo__error">{errores.lineas}</p>}

        <div className="formulario__fila">
          <Field
            etiqueta="Motivo"
            opciones={MOTIVOS_DEVOLUCION.map((m) => ({ valor: m, texto: m }))}
            placeholderOpcion="Seleccionar motivo"
            value={motivo}
            onChange={(e) => elegirMotivo(e.target.value)}
            error={errores.motivo}
          />
          <Field etiqueta="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. llegó con la caja abierta" />
        </div>

        <label className="formulario__casilla">
          <input type="checkbox" checked={regresarInventario} onChange={(e) => setRegresarInventario(e.target.checked)} />
          Regresar las piezas al inventario (vienen en buen estado)
        </label>

        <p className="cotizacion__total">
          Importe a reembolsar: <strong className="texto-mono">{formatearPesos(reembolso)}</strong>
        </p>

        {errorGeneral && <p className="mensaje mensaje--error" role="alert">{errorGeneral}</p>}
      </form>
    </Modal>
  );
}
