import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import { actualizarUsuario, crearUsuario, obtenerUsuariosYRoles } from '../../services/usuarios';
import UsuarioForm from './UsuarioForm';
import './Usuarios.css';

/** Usuarios y roles · RF-02 (gestión de usuarios) y RF-03 (roles) · Jira SCRUM-7 */
export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [esEjemplo, setEsEjemplo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');

  // null = ventana cerrada · 'nuevo' = crear · objeto usuario = editar
  const [formulario, setFormulario] = useState(null);

  useEffect(() => {
    let activo = true;
    obtenerUsuariosYRoles()
      .then((datos) => {
        if (!activo) return;
        setUsuarios(datos.usuarios);
        setRoles(datos.roles);
        setEsEjemplo(datos.esEjemplo);
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  // Nombre del rol a partir de su id
  const nombreDeRol = (rolId) => roles.find((r) => r.id === rolId)?.nombre ?? 'Sin rol';

  // Lista filtrada por el buscador (nombre o correo)
  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return usuarios;
    return usuarios.filter((u) => u.nombre.toLowerCase().includes(texto) || u.correo.toLowerCase().includes(texto));
  }, [usuarios, busqueda]);

  async function guardar(datos) {
    if (formulario === 'nuevo') {
      const nuevo = await crearUsuario(datos);
      setUsuarios((lista) => [...lista, nuevo]);
      setMensaje(`Se creó el usuario ${nuevo.nombre}.`);
    } else {
      const actualizado = await actualizarUsuario(formulario.id, datos);
      setUsuarios((lista) => lista.map((u) => (u.id === actualizado.id ? actualizado : u)));
      setMensaje(`Se guardaron los cambios de ${actualizado.nombre}.`);
    }
    setFormulario(null);
  }

  return (
    <>
      <PageHeader
        titulo="Usuarios"
        datosDeEjemplo={esEjemplo}
        acciones={<Button onClick={() => setFormulario('nuevo')}>Nuevo usuario</Button>}
      />

      {mensaje && (
        <p className="usuarios__mensaje" role="status">
          {mensaje}
        </p>
      )}
      {error && (
        <p className="usuarios__error" role="alert">
          {error}
        </p>
      )}

      <div className="usuarios__filtros">
        <label htmlFor="buscar-usuario" className="solo-lectores">
          Buscar usuario
        </label>
        <input
          id="buscar-usuario"
          type="search"
          className="campo__input usuarios__buscador"
          placeholder="Buscar por nombre o correo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <Table etiqueta="Lista de usuarios">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>
              <span className="solo-lectores">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {cargando && (
            <tr>
              <td colSpan={4} className="tabla__vacia">
                Cargando usuarios…
              </td>
            </tr>
          )}
          {!cargando && visibles.length === 0 && (
            <tr>
              <td colSpan={4} className="tabla__vacia">
                {busqueda ? 'No hay usuarios que coincidan con la búsqueda.' : 'Aún no hay usuarios registrados.'}
              </td>
            </tr>
          )}
          {visibles.map((u) => (
            <tr key={u.id}>
              <td>
                <p className="usuarios__nombre">{u.nombre}</p>
                <p className="usuarios__correo">{u.correo}</p>
              </td>
              <td>{nombreDeRol(u.rolId)}</td>
              <td>
                <Badge tipo={u.activo ? 'ok' : 'neutro'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
              </td>
              <td className="usuarios__celda-accion">
                <button type="button" className="tabla__accion" onClick={() => setFormulario(u)}>
                  Editar<span className="solo-lectores"> a {u.nombre}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {formulario && (
        <UsuarioForm
          usuario={formulario === 'nuevo' ? null : formulario}
          roles={roles}
          usuarios={usuarios}
          alGuardar={guardar}
          alCerrar={() => setFormulario(null)}
        />
      )}
    </>
  );
}
