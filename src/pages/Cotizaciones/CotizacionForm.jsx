import { useState } from 'react';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import Modal from '../../components/Modal/Modal';
import { formatearPesos, totalDeLineas } from '../../utils/formato';

const VIGENCIAS = [
  { valor: '7', texto: '7 días' },
  { valor: '15', texto: '15 días' },
  { valor: '30', texto: '30 días' },
];

/**
 * Ventana "Nueva cotización" (RF-16). Los productos se agregan con el selector
 * de abajo; la cotización no mueve el inventario.
 */
export default function CotizacionForm({ clientes, productos, alGuardar, alCerrar }) {
  const [clienteId, setClienteId] = useState('');
  const [vigencia, setVigencia] = useState('15');
  const [lineas, setLineas] = useState([]);
  const [nuevo, setNuevo] = useState({ productoId: '', cantidad: '1' });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  const producto = (id) => productos.find((p) => p.id === id);

  function agregarLinea() {
    const productoId = Number(nuevo.productoId);
    const cantidad = Number(nuevo.cantidad);
    const e = {};
    if (!productoId) e.productoId = 'Selecciona un producto.';
    if (!Number.isInteger(cantidad) || cantidad <= 0) e.cantidad = 'Cantidad inválida.';
    setErrores((anterior) => ({ ...anterior, ...e, lineas: undefined }));
    if (Object.keys(e).length > 0) return;

    setLineas((anterior) => {
      const existente = anterior.find((l) => l.productoId === productoId);
      if (existente) return anterior.map((l) => (l === existente ? { ...l, cantidad: l.cantidad + cantidad } : l));
      return [...anterior, { productoId, cantidad, precio: producto(productoId).precio }];
    });
    setNuevo({ productoId: '', cantidad: '1' });
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    const e = {};
    if (!clienteId) e.clienteId = 'Selecciona el cliente.';
    if (lineas.length === 0) e.lineas = 'Agrega al menos un producto.';
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await alGuardar({ clienteId: Number(clienteId), vigenciaDias: Number(vigencia), lineas });
    } catch (err) {
      setErrorGeneral(err.message);
      setGuardando(false);
    }
  }

  return (
    <Modal
      abierto
      amplio
      titulo="Nueva cotización"
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={alCerrar}>Cancelar</Button>
          <Button type="submit" form="formulario-cotizacion" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cotización'}
          </Button>
        </>
      }
    >
      <form id="formulario-cotizacion" className="formulario" onSubmit={alEnviar} noValidate>
        <div className="formulario__fila">
          <Field
            etiqueta="Cliente"
            opciones={clientes.filter((c) => c.activo).map((c) => ({ valor: String(c.id), texto: c.nombre }))}
            placeholderOpcion="Seleccionar cliente"
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              setErrores((anterior) => ({ ...anterior, clienteId: undefined }));
            }}
            error={errores.clienteId}
          />
          <Field
            etiqueta="Vigencia"
            opciones={VIGENCIAS}
            placeholderOpcion="Seleccionar vigencia"
            value={vigencia}
            onChange={(e) => setVigencia(e.target.value || '15')}
          />
        </div>

        <fieldset className="cotizacion__agregar">
          <legend className="campo__etiqueta">Agregar producto</legend>
          <Field
            etiqueta="Producto"
            opciones={productos.map((p) => ({ valor: String(p.id), texto: `${p.nombre} · ${formatearPesos(p.precio)}` }))}
            placeholderOpcion="Seleccionar producto"
            value={nuevo.productoId}
            onChange={(e) => {
              setNuevo((anterior) => ({ ...anterior, productoId: e.target.value }));
              setErrores((anterior) => ({ ...anterior, productoId: undefined }));
            }}
            error={errores.productoId}
          />
          <Field
            etiqueta="Cantidad"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={nuevo.cantidad}
            onChange={(e) => {
              setNuevo((anterior) => ({ ...anterior, cantidad: e.target.value }));
              setErrores((anterior) => ({ ...anterior, cantidad: undefined }));
            }}
            error={errores.cantidad}
          />
          <Button variante="secundario" onClick={agregarLinea}>Agregar</Button>
        </fieldset>

        <div className="tabla">
          <div className="tabla__desplazable">
            <table aria-label="Productos de la cotización">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="celda-numero">Cantidad</th>
                  <th className="celda-numero">Importe</th>
                  <th><span className="solo-lectores">Quitar</span></th>
                </tr>
              </thead>
              <tbody>
                {lineas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="tabla__vacia">
                      {errores.lineas ? <span className="campo__error">{errores.lineas}</span> : 'Aún no hay productos en la cotización.'}
                    </td>
                  </tr>
                )}
                {lineas.map((l) => {
                  const p = producto(l.productoId);
                  return (
                    <tr key={l.productoId}>
                      <td>
                        <p className="texto-principal">{p?.nombre}</p>
                        {p && l.cantidad > p.existencia && (
                          <p className="texto-secundario">Hoy solo hay {p.existencia} disponibles.</p>
                        )}
                      </td>
                      <td className="celda-numero texto-mono">{l.cantidad}</td>
                      <td className="celda-numero texto-mono">{formatearPesos(l.cantidad * l.precio)}</td>
                      <td className="celda-accion">
                        <button
                          type="button"
                          className="operacion__quitar"
                          onClick={() => setLineas((anterior) => anterior.filter((x) => x.productoId !== l.productoId))}
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
        </div>

        <p className="cotizacion__total">
          Total (IVA incluido): <strong className="texto-mono">{formatearPesos(totalDeLineas(lineas))}</strong>
        </p>

        {errorGeneral && <p className="mensaje mensaje--error" role="alert">{errorGeneral}</p>}
      </form>
    </Modal>
  );
}
