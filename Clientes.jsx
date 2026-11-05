import { useMemo, useState } from 'react';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import ContactoForm from '../../components/ContactoForm/ContactoForm';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { clientes as servicio } from '../../services/clientes';

/** Clientes · RF-04 · CU-03 · Jira SCRUM-10 */
export default function Clientes() {
  const { datos: lista, setDatos: setLista, cargando, error } = useLista(() => servicio.listar(), []);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos'); // 'todos' | 'activos' | 'inactivos'
  const [mensaje, setMensaje] = useState('');
  const [formulario, setFormulario] = useState(null); // null = cerrado · 'nuevo' · cliente a editar

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return lista.filter((c) => {
      if (estado === 'activos' && !c.activo) return false;
      if (estado === 'inactivos' && c.activo) return false;
      if (!texto) return true;
      return [c.nombre, c.rfc, c.correo].some((valor) => valor?.toLowerCase().includes(texto));
    });
  }, [lista, busqueda, estado]);

  async function guardar(datos) {
    if (formulario === 'nuevo') {
      const nuevo = await servicio.crear(datos);
      setLista((anterior) => [...anterior, nuevo]);
      setMensaje(`Se registró el cliente ${nuevo.nombre}.`);
    } else {
      const actualizado = await servicio.actualizar(formulario.id, datos);
      setLista((anterior) => anterior.map((c) => (c.id === actualizado.id ? actualizado : c)));
      setMensaje(`Se guardaron los cambios de ${actualizado.nombre}.`);
    }
    setFormulario(null);
  }

  return (
    <>
      <PageHeader
        titulo="Clientes"
        datosDeEjemplo={servicio.usaEjemplo}
        acciones={<Button onClick={() => setFormulario('nuevo')}>Nuevo cliente</Button>}
      />

      {mensaje && <p className="mensaje mensaje--exito" role="status">{mensaje}</p>}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <div className="filtros">
        <label htmlFor="buscar-cliente" className="solo-lectores">Buscar cliente</label>
        <input
          id="buscar-cliente"
          type="search"
          className="campo__input filtros__buscador"
          placeholder="Buscar por nombre, RFC o correo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <label htmlFor="estado-cliente" className="solo-lectores">Estado</label>
        <select
          id="estado-cliente"
          className="campo__input filtros__selector"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="todos">Todos los clientes</option>
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
        </select>
      </div>

      <Table etiqueta="Lista de clientes">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Estado</th>
            <th><span className="solo-lectores">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {cargando && (
            <tr><td colSpan={5} className="tabla__vacia">Cargando clientes…</td></tr>
          )}
          {!cargando && visibles.length === 0 && (
            <tr>
              <td colSpan={5} className="tabla__vacia">
                {lista.length === 0 ? 'Aún no hay clientes registrados.' : 'No hay clientes que coincidan con la búsqueda.'}
              </td>
            </tr>
          )}
          {visibles.map((c) => (
            <tr key={c.id}>
              <td>
                <p className="texto-principal">{c.nombre}</p>
                <p className="texto-secundario texto-mono">{c.rfc}</p>
              </td>
              <td className="texto-secundario">{c.telefono || '—'}</td>
              <td className="texto-secundario">{c.correo || '—'}</td>
              <td><Badge tipo={c.activo ? 'ok' : 'neutro'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge></td>
              <td className="celda-accion">
                <button type="button" className="tabla__accion" onClick={() => setFormulario(c)}>
                  Editar<span className="solo-lectores"> a {c.nombre}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {formulario && (
        <ContactoForm
          tipo="cliente"
          conDireccion
          registro={formulario === 'nuevo' ? null : formulario}
          existentes={lista}
          alGuardar={guardar}
          alCerrar={() => setFormulario(null)}
        />
      )}
    </>
  );
}
