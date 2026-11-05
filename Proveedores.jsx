import { useMemo, useState } from 'react';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import ContactoForm from '../../components/ContactoForm/ContactoForm';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { proveedores as servicio } from '../../services/proveedores';

/** Proveedores · RF-05 · CU-04 · Jira SCRUM-11 */
export default function Proveedores() {
  const { datos: lista, setDatos: setLista, cargando, error } = useLista(() => servicio.listar(), []);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const [mensaje, setMensaje] = useState('');
  const [formulario, setFormulario] = useState(null);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return lista.filter((p) => {
      if (estado === 'activos' && !p.activo) return false;
      if (estado === 'inactivos' && p.activo) return false;
      if (!texto) return true;
      return [p.nombre, p.rfc, p.contacto, p.correo].some((valor) => valor?.toLowerCase().includes(texto));
    });
  }, [lista, busqueda, estado]);

  async function guardar(datos) {
    if (formulario === 'nuevo') {
      const nuevo = await servicio.crear(datos);
      setLista((anterior) => [...anterior, nuevo]);
      setMensaje(`Se registró el proveedor ${nuevo.nombre}.`);
    } else {
      const actualizado = await servicio.actualizar(formulario.id, datos);
      setLista((anterior) => anterior.map((p) => (p.id === actualizado.id ? actualizado : p)));
      setMensaje(`Se guardaron los cambios de ${actualizado.nombre}.`);
    }
    setFormulario(null);
  }

  return (
    <>
      <PageHeader
        titulo="Proveedores"
        datosDeEjemplo={servicio.usaEjemplo}
        acciones={<Button onClick={() => setFormulario('nuevo')}>Nuevo proveedor</Button>}
      />

      {mensaje && <p className="mensaje mensaje--exito" role="status">{mensaje}</p>}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <div className="filtros">
        <label htmlFor="buscar-proveedor" className="solo-lectores">Buscar proveedor</label>
        <input
          id="buscar-proveedor"
          type="search"
          className="campo__input filtros__buscador"
          placeholder="Buscar por nombre, RFC o contacto"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <label htmlFor="estado-proveedor" className="solo-lectores">Estado</label>
        <select
          id="estado-proveedor"
          className="campo__input filtros__selector"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="todos">Todos los proveedores</option>
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
        </select>
      </div>

      <Table etiqueta="Lista de proveedores">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th><span className="solo-lectores">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {cargando && (
            <tr><td colSpan={5} className="tabla__vacia">Cargando proveedores…</td></tr>
          )}
          {!cargando && visibles.length === 0 && (
            <tr>
              <td colSpan={5} className="tabla__vacia">
                {lista.length === 0 ? 'Aún no hay proveedores registrados.' : 'No hay proveedores que coincidan con la búsqueda.'}
              </td>
            </tr>
          )}
          {visibles.map((p) => (
            <tr key={p.id}>
              <td>
                <p className="texto-principal">{p.nombre}</p>
                <p className="texto-secundario texto-mono">{p.rfc}</p>
              </td>
              <td>
                <p>{p.contacto || '—'}</p>
                {p.correo && <p className="texto-secundario">{p.correo}</p>}
              </td>
              <td className="texto-secundario">{p.telefono || '—'}</td>
              <td><Badge tipo={p.activo ? 'ok' : 'neutro'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge></td>
              <td className="celda-accion">
                <button type="button" className="tabla__accion" onClick={() => setFormulario(p)}>
                  Editar<span className="solo-lectores"> a {p.nombre}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {formulario && (
        <ContactoForm
          tipo="proveedor"
          conContacto
          registro={formulario === 'nuevo' ? null : formulario}
          existentes={lista}
          alGuardar={guardar}
          alCerrar={() => setFormulario(null)}
        />
      )}
    </>
  );
}
