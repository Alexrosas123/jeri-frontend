import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { clientes } from '../../services/clientes';
import {
  cambiarEstadoCotizacion,
  crearCotizacion,
  estadoCotizacion,
  listarCotizaciones,
  usaEjemplo,
} from '../../services/cotizaciones';
import { obtenerCatalogo } from '../../services/productos';
import { formatearFecha, formatearPesos } from '../../utils/formato';
import CotizacionDetalle from './CotizacionDetalle';
import CotizacionForm from './CotizacionForm';
import { ESTADOS } from './estados';
import './Cotizaciones.css';

async function cargarPantalla() {
  const [cotizaciones, listaClientes, catalogo] = await Promise.all([
    listarCotizaciones(),
    clientes.listar(),
    obtenerCatalogo(),
  ]);
  return { cotizaciones, clientes: listaClientes, productos: catalogo.productos };
}

/** Cotizaciones · RF-16 */
export default function Cotizaciones() {
  const navegar = useNavigate();
  const { datos, setDatos, cargando, error } = useLista(cargarPantalla, { cotizaciones: [], clientes: [], productos: [] });
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [creando, setCreando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const cliente = (id) => datos.clientes.find((c) => c.id === id);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return datos.cotizaciones.filter((c) => {
      if (filtro !== 'todos' && estadoCotizacion(c) !== filtro) return false;
      if (!texto) return true;
      const nombre = datos.clientes.find((x) => x.id === c.clienteId)?.nombre ?? '';
      return c.folio.toLowerCase().includes(texto) || nombre.toLowerCase().includes(texto);
    });
  }, [datos, busqueda, filtro]);

  async function guardarNueva(valores) {
    const nueva = await crearCotizacion(valores);
    setDatos((anterior) => ({ ...anterior, cotizaciones: [nueva, ...anterior.cotizaciones] }));
    setCreando(false);
    setMensaje(`Se guardó la cotización ${nueva.folio} para ${cliente(nueva.clienteId)?.nombre ?? 'el cliente'}.`);
  }

  async function cambiarEstado(cotizacion, estado) {
    const actualizada = await cambiarEstadoCotizacion(cotizacion.id, estado);
    setDatos((anterior) => ({
      ...anterior,
      cotizaciones: anterior.cotizaciones.map((c) => (c.id === actualizada.id ? actualizada : c)),
    }));
    setDetalle(null);
    setMensaje(`La cotización ${actualizada.folio} se marcó como ${ESTADOS[estado].texto.toLowerCase()}.`);
  }

  // Abre "Registrar venta" con el cliente y los productos de la cotización
  const convertir = (cotizacion) => navegar('/ventas', { state: { cotizacion } });

  function accion(c) {
    const estado = estadoCotizacion(c);
    if (estado === 'aceptada') {
      return (
        <button type="button" className="tabla__accion" onClick={() => convertir(c)}>
          Convertir en venta<span className="solo-lectores"> {c.folio}</span>
        </button>
      );
    }
    return (
      <button type="button" className="tabla__accion" onClick={() => setDetalle(c)}>
        {estado === 'convertida' ? 'Ver venta' : 'Ver'}
        <span className="solo-lectores"> {c.folio}</span>
      </button>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Cotizaciones"
        datosDeEjemplo={usaEjemplo}
        acciones={<Button onClick={() => setCreando(true)} disabled={cargando}>Nueva cotización</Button>}
      />

      {mensaje && <p className="mensaje mensaje--exito" role="status">{mensaje}</p>}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <div className="filtros">
        <label htmlFor="buscar-cotizacion" className="solo-lectores">Buscar cotización</label>
        <input
          id="buscar-cotizacion"
          type="search"
          className="campo__input filtros__buscador"
          placeholder="Buscar por folio o cliente"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <label htmlFor="filtro-cotizacion" className="solo-lectores">Estado</label>
        <select
          id="filtro-cotizacion"
          className="campo__input filtros__selector"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          {Object.entries(ESTADOS).map(([valor, { texto }]) => (
            <option key={valor} value={valor}>{texto}</option>
          ))}
        </select>
      </div>

      <Table etiqueta="Cotizaciones">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th className="celda-numero">Total</th>
            <th>Estado</th>
            <th><span className="solo-lectores">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {cargando && <tr><td colSpan={6} className="tabla__vacia">Cargando cotizaciones…</td></tr>}
          {!cargando && visibles.length === 0 && (
            <tr><td colSpan={6} className="tabla__vacia">No hay cotizaciones con ese filtro.</td></tr>
          )}
          {visibles.map((c) => {
            const estado = ESTADOS[estadoCotizacion(c)];
            return (
              <tr key={c.id}>
                <td className="texto-mono">{c.folio}</td>
                <td className="texto-principal">{cliente(c.clienteId)?.nombre ?? 'Cliente'}</td>
                <td className="texto-secundario">{formatearFecha(c.fecha)}</td>
                <td className="celda-numero texto-mono">{formatearPesos(c.total)}</td>
                <td><Badge tipo={estado.tipo}>{estado.texto}</Badge></td>
                <td className="celda-accion">{accion(c)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {creando && (
        <CotizacionForm
          clientes={datos.clientes}
          productos={datos.productos}
          alGuardar={guardarNueva}
          alCerrar={() => setCreando(false)}
        />
      )}

      {detalle && (
        <CotizacionDetalle
          cotizacion={detalle}
          cliente={cliente(detalle.clienteId)}
          productos={datos.productos}
          alCambiarEstado={cambiarEstado}
          alConvertir={convertir}
          alCerrar={() => setDetalle(null)}
        />
      )}
    </>
  );
}
