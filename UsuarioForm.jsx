import { useState } from 'react';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import Modal from '../../components/Modal/Modal';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VACIO = { nombre: '', correo: '', telefono: '', rolId: '', activo: true };

function validar(datos, usuarios, idEditando) {
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Escribe el nombre completo.';
  if (!datos.correo.trim()) errores.correo = 'Escribe el correo.';
  else if (!FORMATO_CORREO.test(datos.correo.trim())) errores.correo = 'El correo no tiene un formato válido.';
  else if (
    usuarios.some((u) => u.correo.toLowerCase() === datos.correo.trim().toLowerCase() && u.id !== idEditando)
  ) {
    errores.correo = 'Ya existe un usuario con este correo.';
  }
  if (!datos.rolId) errores.rolId = 'Selecciona un rol.';
  return errores;
}

/**
 * Ventana emergente para crear o editar un usuario.
 * Si recibe `usuario`, se abre en modo edición con sus datos.
 */
export default function UsuarioForm({ usuario, roles, usuarios, alGuardar, alCerrar }) {
  const editando = Boolean(usuario);
  const [datos, setDatos] = useState(() => (usuario ? { ...usuario, rolId: String(usuario.rolId ?? '') } : VACIO));
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  // Actualiza un campo y borra su error mientras el usuario escribe
  const cambiar = (campo) => (evento) => {
    const valor = evento.target.type === 'checkbox' ? evento.target.checked : evento.target.value;
    setDatos((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  async function alEnviar(evento) {
    evento.preventDefault();
    const nuevosErrores = validar(datos, usuarios, usuario?.id);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      await alGuardar({ ...datos, nombre: datos.nombre.trim(), correo: datos.correo.trim() });
    } catch (error) {
      setErrorGeneral(error.message);
      setGuardando(false);
    }
  }

  return (
    <Modal
      abierto
      titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-usuario" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <form id="formulario-usuario" onSubmit={alEnviar} noValidate className="usuarios__formulario">
        <Field
          etiqueta="Nombre completo"
          value={datos.nombre}
          onChange={cambiar('nombre')}
          error={errores.nombre}
          placeholder="Nombre y apellidos"
          autoComplete="off"
        />
        <Field
          etiqueta="Correo electrónico"
          type="email"
          value={datos.correo}
          onChange={cambiar('correo')}
          error={errores.correo}
          placeholder="correo@ejemplo.com"
          autoComplete="off"
        />
        <Field
          etiqueta="Teléfono (opcional)"
          type="tel"
          value={datos.telefono}
          onChange={cambiar('telefono')}
          placeholder="55 0000 0000"
        />
        <Field
          etiqueta="Rol"
          opciones={roles.map((r) => ({ valor: String(r.id), texto: r.nombre }))}
          placeholderOpcion="Seleccionar rol"
          value={datos.rolId}
          onChange={cambiar('rolId')}
          error={errores.rolId}
        />

        {editando && (
          <label className="usuarios__activo">
            <input type="checkbox" checked={datos.activo} onChange={cambiar('activo')} /> Usuario activo
          </label>
        )}

        {!editando && (
          <p className="usuarios__nota">El usuario recibirá una contraseña temporal por correo.</p>
        )}

        {errorGeneral && (
          <p className="usuarios__error" role="alert">
            {errorGeneral}
          </p>
        )}
      </form>
    </Modal>
  );
}
