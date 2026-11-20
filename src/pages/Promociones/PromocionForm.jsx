import { useState } from 'react';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import Modal from '../../components/Modal/Modal';
import { aTextoFecha } from '../../utils/fechas';

/** Ventana para crear o editar una promoción (descuento por cliente y/o producto) */
export default function PromocionForm({ promocion, clientes, productos, alGuardar, alCerrar }) {
  const editando = Boolean(promocion);
  const [datos, setDatos] = useState(() =>
    promocion
      ? {
          ...promocion,
          clienteId: promocion.clienteId ? String(promocion.clienteId) : '',
          productoId: promocion.productoId ? String(promocion.productoId) : '',
          porcentaje: String(promocion.porcentaje),
        }
      : { nombre: '', clienteId: '', productoId: '', porcentaje: '', desde: aTextoFecha(new Date()), hasta: '', activa: true },
  );
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  const cambiar = (campo) => (evento) => {
    const valor = evento.target.type === 'checkbox' ? evento.target.checked : evento.target.value;
    setDatos((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  function validar() {
    const e = {};
    const porcentaje = Number(datos.porcentaje);
    if (!datos.nombre.trim()) e.nombre = 'Escribe un nombre para identificar la promoción.';
    if (!datos.porcentaje || !(porcentaje > 0) || porcentaje > 90) e.porcentaje = 'Escribe un descuento entre 1 y 90 %.';
    if (!datos.desde) e.desde = 'Elige la fecha de inicio.';
    if (!datos.hasta) e.hasta = 'Elige la fecha de fin.';
    else if (datos.desde && datos.hasta < datos.desde) e.hasta = 'Debe ser igual o posterior a la fecha de inicio.';
    return e;
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    setGuardando(true);
    setErrorGeneral('');
    try {
      await alGuardar({
        nombre: datos.nombre.trim(),
        clienteId: datos.clienteId ? Number(datos.clienteId) : null,
        productoId: datos.productoId ? Number(datos.productoId) : null,
        porcentaje: Math.round(Number(datos.porcentaje) * 100) / 100,
        desde: datos.desde,
        hasta: datos.hasta,
        activa: datos.activa,
      });
    } catch (err) {
      setErrorGeneral(err.message);
      setGuardando(false);
    }
  }

  const alcance =
    datos.clienteId && datos.productoId
      ? 'Precio especial: solo ese producto para ese cliente.'
      : datos.clienteId
        ? 'Descuento para ese cliente en todos los productos.'
        : datos.productoId
          ? 'Descuento en ese producto para todos los clientes.'
          : 'Descuento general: todos los productos para todos los clientes.';

  return (
    <Modal
      abierto
      titulo={editando ? 'Editar promoción' : 'Nueva promoción'}
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={alCerrar}>Cancelar</Button>
          <Button type="submit" form="formulario-promocion" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar promoción'}
          </Button>
        </>
      }
    >
      <form id="formulario-promocion" className="formulario" onSubmit={alEnviar} noValidate>
        <Field etiqueta="Nombre" value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} placeholder="Ej. Buen Fin, Cliente frecuente" autoComplete="off" />
        <div className="formulario__fila">
          <Field
            etiqueta="Cliente"
            opciones={clientes.filter((c) => c.activo || String(c.id) === datos.clienteId).map((c) => ({ valor: String(c.id), texto: c.nombre }))}
            placeholderOpcion="Todos los clientes"
            value={datos.clienteId}
            onChange={cambiar('clienteId')}
          />
          <Field
            etiqueta="Producto"
            opciones={productos.map((p) => ({ valor: String(p.id), texto: `${p.nombre} · ${p.sku}` }))}
            placeholderOpcion="Todos los productos"
            value={datos.productoId}
            onChange={cambiar('productoId')}
          />
        </div>
        <p className="formulario__nota" aria-live="polite">{alcance}</p>
        <div className="formulario__fila">
          <Field
            etiqueta="Descuento (%)"
            type="number"
            inputMode="decimal"
            min="1"
            max="90"
            step="0.5"
            value={datos.porcentaje}
            onChange={cambiar('porcentaje')}
            error={errores.porcentaje}
            placeholder="10"
          />
          <div />
        </div>
        <div className="formulario__fila">
          <Field etiqueta="Desde" type="date" value={datos.desde} onChange={cambiar('desde')} error={errores.desde} />
          <Field etiqueta="Hasta" type="date" value={datos.hasta} onChange={cambiar('hasta')} error={errores.hasta} min={datos.desde || undefined} />
        </div>
        {editando && (
          <label className="formulario__casilla">
            <input type="checkbox" checked={datos.activa} onChange={cambiar('activa')} /> Promoción activa (si la desmarcas, queda en pausa)
          </label>
        )}
        {errorGeneral && <p className="mensaje mensaje--error" role="alert">{errorGeneral}</p>}
      </form>
    </Modal>
  );
}
