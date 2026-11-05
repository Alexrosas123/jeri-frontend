import { useState } from 'react';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import Modal from '../../components/Modal/Modal';
import { formatearPesos } from '../../utils/formato';

/** Ventana "Agregar producto a la compra": producto, cantidad y costo unitario. */
export default function LineaCompraForm({ productos, alAgregar, alCerrar }) {
  const [datos, setDatos] = useState({ productoId: '', cantidad: '', precio: '' });
  const [errores, setErrores] = useState({});

  const cambiar = (campo) => (evento) => {
    setDatos((anterior) => ({ ...anterior, [campo]: evento.target.value }));
    setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  const cantidad = Number(datos.cantidad);
  const precio = Number(datos.precio);

  function alEnviar(evento) {
    evento.preventDefault();
    const e = {};
    if (!datos.productoId) e.productoId = 'Selecciona un producto.';
    if (!Number.isInteger(cantidad) || cantidad <= 0) e.cantidad = 'Escribe una cantidad entera mayor a 0.';
    if (!datos.precio || !(precio > 0)) e.precio = 'Escribe un costo mayor a 0.';
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    alAgregar({ productoId: Number(datos.productoId), cantidad, precio: Math.round(precio * 100) / 100 });
  }

  return (
    <Modal
      abierto
      titulo="Agregar producto a la compra"
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={alCerrar}>Cancelar</Button>
          <Button type="submit" form="formulario-linea-compra">Agregar</Button>
        </>
      }
    >
      <form id="formulario-linea-compra" className="formulario" onSubmit={alEnviar} noValidate>
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
            etiqueta="Costo unitario"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={datos.precio}
            onChange={cambiar('precio')}
            error={errores.precio}
          />
        </div>
        {cantidad > 0 && precio > 0 && (
          <p className="formulario__nota">
            Costo total de esta línea: <strong>{formatearPesos(cantidad * precio)}</strong>
          </p>
        )}
      </form>
    </Modal>
  );
}
