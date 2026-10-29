import { useState } from 'react';
import Button from '../Button/Button';
import Field from '../Field/Field';
import Modal from '../Modal/Modal';
import { esCorreoValido, esRfcValido, esTelefonoValido, limpiarTextos } from '../../utils/validaciones';

/**
 * Ventana emergente para crear o editar un cliente o un proveedor.
 * Ambos comparten casi los mismos datos; las diferencias se activan con:
 *   - `conContacto`: muestra "Persona de contacto" (proveedores)
 *   - `conDireccion`: muestra "Dirección" (clientes)
 *
 * `existentes` sirve para avisar si el RFC ya está registrado.
 */
export default function ContactoForm({
  tipo, // 'cliente' | 'proveedor' (para los textos)
  registro,
  existentes,
  conContacto = false,
  conDireccion = false,
  alGuardar,
  alCerrar,
}) {
  const editando = Boolean(registro);
  const [datos, setDatos] = useState(
    registro ?? { nombre: '', rfc: '', contacto: '', telefono: '', correo: '', direccion: '', activo: true },
  );
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  const cambiar = (campo) => (evento) => {
    let valor = evento.target.type === 'checkbox' ? evento.target.checked : evento.target.value;
    if (campo === 'rfc') valor = valor.toUpperCase(); // el RFC siempre va en mayúsculas
    setDatos((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  function validar(d) {
    const e = {};
    if (!d.nombre.trim()) e.nombre = 'Escribe el nombre o la razón social.';
    if (!d.rfc.trim()) e.rfc = 'Escribe el RFC.';
    else if (!esRfcValido(d.rfc)) e.rfc = 'El RFC debe tener 12 o 13 caracteres, por ejemplo XAXX010101000.';
    else if (existentes.some((x) => x.rfc.toUpperCase() === d.rfc.trim().toUpperCase() && x.id !== registro?.id)) {
      e.rfc = `Ya existe un ${tipo} con este RFC.`;
    }
    if (d.telefono.trim() && !esTelefonoValido(d.telefono)) e.telefono = 'El teléfono debe tener 10 dígitos.';
    if (d.correo.trim() && !esCorreoValido(d.correo)) e.correo = 'El correo no tiene un formato válido.';
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
      const limpio = limpiarTextos(datos);
      await alGuardar({ ...limpio, rfc: limpio.rfc.toUpperCase() });
    } catch (error) {
      setErrorGeneral(error.message);
      setGuardando(false);
    }
  }

  const titulo = `${editando ? 'Editar' : 'Nuevo'} ${tipo}`;

  return (
    <Modal
      abierto
      titulo={titulo}
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-contacto" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : `Guardar ${tipo}`}
          </Button>
        </>
      }
    >
      <form id="formulario-contacto" className="formulario" onSubmit={alEnviar} noValidate>
        <Field
          etiqueta="Nombre o razón social"
          value={datos.nombre}
          onChange={cambiar('nombre')}
          error={errores.nombre}
          autoComplete="off"
        />
        <Field
          etiqueta="RFC"
          value={datos.rfc}
          onChange={cambiar('rfc')}
          error={errores.rfc}
          placeholder="XAXX010101000"
          maxLength={13}
          style={{ textTransform: 'uppercase' }}
          autoComplete="off"
        />
        {conContacto && (
          <Field
            etiqueta="Persona de contacto (opcional)"
            value={datos.contacto}
            onChange={cambiar('contacto')}
            autoComplete="off"
          />
        )}
        <div className="formulario__fila">
          <Field
            etiqueta="Teléfono (opcional)"
            type="tel"
            value={datos.telefono}
            onChange={cambiar('telefono')}
            error={errores.telefono}
            placeholder="55 0000 0000"
          />
          <Field
            etiqueta="Correo (opcional)"
            type="email"
            value={datos.correo}
            onChange={cambiar('correo')}
            error={errores.correo}
            placeholder="correo@ejemplo.com"
          />
        </div>
        {conDireccion && (
          <Field
            etiqueta="Dirección (opcional)"
            value={datos.direccion}
            onChange={cambiar('direccion')}
            placeholder="Calle, número, colonia, ciudad"
          />
        )}
        {editando && (
          <label className="formulario__casilla">
            <input type="checkbox" checked={datos.activo} onChange={cambiar('activo')} /> {tipo === 'cliente' ? 'Cliente' : 'Proveedor'} activo
          </label>
        )}
        {errorGeneral && (
          <p className="mensaje mensaje--error" role="alert">
            {errorGeneral}
          </p>
        )}
      </form>
    </Modal>
  );
}
