import { useState } from 'react';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import Modal from '../../components/Modal/Modal';

const MOTIVOS = {
  entrada: ['Compra', 'Devolución de cliente', 'Ajuste autorizado'],
  salida: ['Venta', 'Merma o caducidad', 'Ajuste autorizado'],
};

/**
 * Ventana para registrar una entrada (RF-09) o una salida (RF-10) de mercancía.
 * Muestra cómo quedará la existencia antes de confirmar.
 */
export default function MovimientoForm({ tipo, productos, productoInicial, alGuardar, alCerrar }) {
  const [datos, setDatos] = useState({
    productoId: productoInicial ? String(productoInicial) : '',
    cantidad: '',
    motivo: MOTIVOS[tipo][0],
    nota: '',
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  const producto = productos.find((p) => p.id === Number(datos.productoId));
  const cantidad = Number(datos.cantidad);
  const cantidadValida = Number.isInteger(cantidad) && cantidad > 0;
  const nuevaExistencia = producto && cantidadValida
    ? producto.existencia + (tipo === 'entrada' ? cantidad : -cantidad)
    : null;

  const cambiar = (campo) => (evento) => {
    setDatos((anterior) => ({ ...anterior, [campo]: evento.target.value }));
    setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  function validar() {
    const e = {};
    if (!producto) e.productoId = 'Selecciona un producto.';
    if (!cantidadValida) e.cantidad = 'Escribe una cantidad entera mayor a 0.';
    else if (tipo === 'salida' && producto && cantidad > producto.existencia) {
      e.cantidad = `Solo hay ${producto.existencia} en existencia.`;
    }
    return e;
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await alGuardar({ productoId: producto.id, tipo, cantidad, motivo: datos.motivo, nota: datos.nota.trim() });
    } catch (error) {
      setErrorGeneral(error.message);
      setGuardando(false);
    }
  }

  const esEntrada = tipo === 'entrada';

  return (
    <Modal
      abierto
      titulo={esEntrada ? 'Registrar entrada' : 'Registrar salida'}
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={alCerrar}>Cancelar</Button>
          <Button type="submit" form="formulario-movimiento" disabled={guardando}>
            {guardando ? 'Registrando…' : esEntrada ? 'Registrar entrada' : 'Registrar salida'}
          </Button>
        </>
      }
    >
      <form id="formulario-movimiento" className="formulario" onSubmit={alEnviar} noValidate>
        <Field
          etiqueta="Producto"
          opciones={productos.map((p) => ({ valor: String(p.id), texto: `${p.nombre} · ${p.sku}` }))}
          placeholderOpcion="Seleccionar producto"
          value={datos.productoId}
          onChange={cambiar('productoId')}
          error={errores.productoId}
        />
        <div className="formulario__fila">
          <Field
            etiqueta="Cantidad"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={datos.cantidad}
            onChange={cambiar('cantidad')}
            error={errores.cantidad}
          />
          <Field
            etiqueta="Motivo"
            opciones={MOTIVOS[tipo].map((m) => ({ valor: m, texto: m }))}
            placeholderOpcion="Seleccionar motivo"
            value={datos.motivo}
            onChange={cambiar('motivo')}
          />
        </div>
        <Field
          etiqueta="Nota (opcional)"
          value={datos.nota}
          onChange={cambiar('nota')}
          placeholder={esEntrada ? 'Ej. folio de la compra' : 'Ej. folio de la venta'}
        />

        {producto && (
          <p className="formulario__nota" aria-live="polite">
            {nuevaExistencia === null ? (
              <>Existencia actual: <strong>{producto.existencia}</strong></>
            ) : (
              <>
                La existencia pasará de <strong>{producto.existencia}</strong> a{' '}
                <strong className={nuevaExistencia < 0 ? 'inventario__negativo' : ''}>{nuevaExistencia}</strong>.
              </>
            )}
          </p>
        )}

        {errorGeneral && <p className="mensaje mensaje--error" role="alert">{errorGeneral}</p>}
      </form>
    </Modal>
  );
}
