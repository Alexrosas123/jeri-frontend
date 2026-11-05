import { useState } from 'react';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import Modal from '../../components/Modal/Modal';

const VACIO = { nombre: '', sku: '', categoriaId: '', marcaId: '', precio: '', stockMinimo: '' };

/** Ventana emergente para crear o editar un producto (RF-06) */
export default function ProductoForm({ producto, productos, categorias, marcas, alGuardar, alCerrar }) {
  const editando = Boolean(producto);
  const [datos, setDatos] = useState(() =>
    producto
      ? {
          ...producto,
          categoriaId: String(producto.categoriaId),
          marcaId: String(producto.marcaId),
          precio: String(producto.precio),
          stockMinimo: String(producto.stockMinimo),
        }
      : VACIO,
  );
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  const cambiar = (campo) => (evento) => {
    setDatos((anterior) => ({ ...anterior, [campo]: evento.target.value }));
    setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  function validar(d) {
    const e = {};
    if (!d.nombre.trim()) e.nombre = 'Escribe el nombre del producto.';
    if (!d.sku.trim()) e.sku = 'Escribe el SKU.';
    else if (productos.some((p) => p.sku.toUpperCase() === d.sku.trim().toUpperCase() && p.id !== producto?.id)) {
      e.sku = 'Ya existe un producto con este SKU.';
    }
    if (!d.categoriaId) e.categoriaId = 'Selecciona una categoría.';
    if (!d.marcaId) e.marcaId = 'Selecciona una marca.';
    if (d.precio === '' || Number(d.precio) <= 0) e.precio = 'Escribe un precio mayor a 0.';
    if (d.stockMinimo === '' || !Number.isInteger(Number(d.stockMinimo)) || Number(d.stockMinimo) < 0) {
      e.stockMinimo = 'Escribe un número entero de 0 o más.';
    }
    return e;
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    const nuevosErrores = validar(datos);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await alGuardar({
        nombre: datos.nombre.trim(),
        sku: datos.sku.trim().toUpperCase(),
        categoriaId: Number(datos.categoriaId),
        marcaId: Number(datos.marcaId),
        precio: Number(datos.precio),
        stockMinimo: Number(datos.stockMinimo),
      });
    } catch (error) {
      setErrorGeneral(error.message);
      setGuardando(false);
    }
  }

  return (
    <Modal
      abierto
      titulo={editando ? 'Editar producto' : 'Nuevo producto'}
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={alCerrar}>Cancelar</Button>
          <Button type="submit" form="formulario-producto" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar producto'}
          </Button>
        </>
      }
    >
      <form id="formulario-producto" className="formulario" onSubmit={alEnviar} noValidate>
        <Field etiqueta="Nombre" value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} autoComplete="off" />
        <div className="formulario__fila">
          <Field
            etiqueta="SKU"
            value={datos.sku}
            onChange={cambiar('sku')}
            error={errores.sku}
            placeholder="Ej. MC-003"
            style={{ textTransform: 'uppercase' }}
            autoComplete="off"
          />
          <Field
            etiqueta="Categoría"
            opciones={categorias.map((c) => ({ valor: String(c.id), texto: c.nombre }))}
            value={datos.categoriaId}
            onChange={cambiar('categoriaId')}
            error={errores.categoriaId}
          />
        </div>
        <div className="formulario__fila">
          <Field
            etiqueta="Marca"
            opciones={marcas.map((m) => ({ valor: String(m.id), texto: m.nombre }))}
            value={datos.marcaId}
            onChange={cambiar('marcaId')}
            error={errores.marcaId}
          />
          <Field
            etiqueta="Precio de venta"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={datos.precio}
            onChange={cambiar('precio')}
            error={errores.precio}
            placeholder="0.00"
          />
        </div>
        <div className="formulario__fila">
          <Field
            etiqueta="Stock mínimo"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={datos.stockMinimo}
            onChange={cambiar('stockMinimo')}
            error={errores.stockMinimo}
            placeholder="0"
          />
        </div>
        <p className="formulario__nota">
          {editando
            ? `Existencia actual: ${producto.existencia}. La existencia se modifica desde Inventario.`
            : 'El producto se registra con existencia 0. Las existencias se agregan desde Inventario.'}
        </p>
        {errorGeneral && <p className="mensaje mensaje--error" role="alert">{errorGeneral}</p>}
      </form>
    </Modal>
  );
}
