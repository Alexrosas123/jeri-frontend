import { useState } from 'react';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { estadoCotizacion, venceEl } from '../../services/cotizaciones';
import { formatearFecha, formatearPesos } from '../../utils/formato';
import { ESTADOS } from './estados';

/** Ventana con el detalle de una cotización y las acciones según su estado. */
export default function CotizacionDetalle({ cotizacion, cliente, productos, alCambiarEstado, alConvertir, alCerrar }) {
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const estado = estadoCotizacion(cotizacion);
  const nombreProducto = (id) => productos.find((p) => p.id === id)?.nombre ?? 'Producto';

  async function cambiar(nuevoEstado) {
    setTrabajando(true);
    setError('');
    try {
      await alCambiarEstado(cotizacion, nuevoEstado);
    } catch (err) {
      setError(err.message);
      setTrabajando(false);
    }
  }

  let acciones = <Button onClick={alCerrar}>Cerrar</Button>;
  if (estado === 'pendiente') {
    acciones = (
      <>
        <Button variante="secundario" onClick={() => cambiar('rechazada')} disabled={trabajando}>Marcar rechazada</Button>
        <Button onClick={() => cambiar('aceptada')} disabled={trabajando}>Marcar aceptada</Button>
      </>
    );
  } else if (estado === 'aceptada') {
    acciones = (
      <>
        <Button variante="secundario" onClick={alCerrar}>Cerrar</Button>
        <Button onClick={() => alConvertir(cotizacion)}>Convertir en venta</Button>
      </>
    );
  }

  return (
    <Modal abierto amplio titulo={`Cotización ${cotizacion.folio}`} alCerrar={alCerrar} acciones={acciones}>
      <div className="cotizacion__detalle">
        <dl className="cotizacion__datos">
          <div><dt>Cliente</dt><dd>{cliente?.nombre ?? 'Cliente'}</dd></div>
          <div><dt>Fecha</dt><dd>{formatearFecha(cotizacion.fecha)}</dd></div>
          <div><dt>Vigente hasta</dt><dd>{formatearFecha(venceEl(cotizacion))}</dd></div>
          <div><dt>Estado</dt><dd><Badge tipo={ESTADOS[estado].tipo}>{ESTADOS[estado].texto}</Badge></dd></div>
        </dl>

        {estado === 'convertida' && cotizacion.ventaFolio && (
          <p className="mensaje mensaje--exito">
            Se convirtió en la venta <strong className="texto-mono">{cotizacion.ventaFolio}</strong>.
          </p>
        )}
        {estado === 'vencida' && (
          <p className="formulario__nota">Pasó su vigencia sin respuesta. Si el cliente la sigue queriendo, haz una cotización nueva.</p>
        )}

        <div className="tabla">
          <div className="tabla__desplazable">
            <table aria-label="Productos cotizados">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="celda-numero">Cantidad</th>
                  <th className="celda-numero">Precio</th>
                  <th className="celda-numero">Importe</th>
                </tr>
              </thead>
              <tbody>
                {cotizacion.lineas.map((l) => (
                  <tr key={l.productoId}>
                    <td className="texto-principal">{nombreProducto(l.productoId)}</td>
                    <td className="celda-numero texto-mono">{l.cantidad}</td>
                    <td className="celda-numero texto-mono">{formatearPesos(l.precio)}</td>
                    <td className="celda-numero texto-mono">{formatearPesos(l.cantidad * l.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="cotizacion__total">
          Total (IVA incluido): <strong className="texto-mono">{formatearPesos(cotizacion.total)}</strong>
        </p>

        {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
