import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { clientes as servicioClientes } from '../../services/clientes';
import { listarDevoluciones, registrarDevolucion, usaEjemplo } from '../../services/devoluciones';
import { obtenerCatalogo } from '../../services/productos';
import { listarVentas } from '../../services/ventas';
import { formatearFecha, formatearPesos } from '../../utils/formato';
import DevolucionForm from './DevolucionForm';
import '../Cotizaciones/Cotizaciones.css';

async function cargarPantalla() {
  const [devoluciones, ventas, clientes, catalogo] = await Promise.all([
    listarDevoluciones(),
    listarVentas(),
    servicioClientes.listar(),
    obtenerCatalogo(),
  ]);
  return { devoluciones, ventas, clientes, productos: catalogo.productos };
}

/** Devoluciones de cliente */
export default function Devoluciones() {
  const { datos, setDatos, cargando, error } = useLista(cargarPantalla, { devoluciones: [], ventas: [], clientes: [], productos: [] });
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const nombreCliente = (id) => datos.clientes.find((c) => c.id === id)?.nombre ?? 'Cliente';
  const nombreProducto = (id) => datos.productos.find((p) => p.id === id)?.nombre ?? 'Producto';

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return [...datos.devoluciones]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .filter((d) => {
        if (!texto) return true;
        const cliente = datos.clientes.find((c) => c.id === d.clienteId)?.nombre ?? '';
        return [d.folio, d.ventaFolio, cliente].some((v) => v.toLowerCase().includes(texto));
      });
  }, [datos, busqueda]);

  async function guardar(valores) {
    const nueva = await registrarDevolucion(valores);
    setDatos((anterior) => ({ ...anterior, devoluciones: [nueva, ...anterior.devoluciones] }));
    setCreando(false);
    setMensaje(
      `Se registró la devolución ${nueva.folio} de la venta ${nueva.ventaFolio}. Importe a reembolsar: ${formatearPesos(nueva.total)}.` +
        (nueva.regresarInventario ? ' Las piezas se sumaron al inventario.' : ' Las piezas no regresaron al inventario.'),
    );
  }

  return (
    <>
      <PageHeader
        titulo="Devoluciones de cliente"
        datosDeEjemplo={usaEjemplo}
        acciones={<Button onClick={() => setCreando(true)} disabled={cargando}>Nueva devolución</Button>}
      />

      {mensaje && <p className="mensaje mensaje--exito" role="status">{mensaje}</p>}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <div className="filtros">
        <label htmlFor="buscar-devolucion" className="solo-lectores">Buscar devolución</label>
        <input
          id="buscar-devolucion"
          type="search"
          className="campo__input filtros__buscador"
          placeholder="Buscar por folio, venta o cliente"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <Table etiqueta="Devoluciones">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Venta · Cliente</th>
            <th>Fecha</th>
            <th>Productos y motivo</th>
            <th className="celda-numero">Reembolso</th>
            <th>Inventario</th>
          </tr>
        </thead>
        <tbody>
          {cargando && <tr><td colSpan={6} className="tabla__vacia">Cargando devoluciones…</td></tr>}
          {!cargando && visibles.length === 0 && (
            <tr><td colSpan={6} className="tabla__vacia">{busqueda ? 'No hay devoluciones con esa búsqueda.' : 'Aún no hay devoluciones registradas.'}</td></tr>
          )}
          {visibles.map((d) => (
            <tr key={d.id}>
              <td className="texto-mono">{d.folio}</td>
              <td>
                <p className="texto-mono">{d.ventaFolio}</p>
                <Link to={`/clientes/${d.clienteId}`} className="texto-secundario enlace-tabla">{nombreCliente(d.clienteId)}</Link>
              </td>
              <td className="texto-secundario">{formatearFecha(d.fecha)}</td>
              <td>
                {d.lineas.map((l) => (
                  <p key={l.productoId}>{l.cantidad} × {nombreProducto(l.productoId)}</p>
                ))}
                <p className="texto-secundario">{d.motivo}{d.nota ? ` · ${d.nota}` : ''}</p>
              </td>
              <td className="celda-numero texto-mono">{formatearPesos(d.total)}</td>
              <td>
                {d.regresarInventario ? <Badge tipo="ok">Regresó al inventario</Badge> : <Badge tipo="neutro">No regresó</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <p className="formulario__nota">
        Solo se puede devolver lo que se vendió. El reembolso usa el precio que pagó el cliente (con descuento, si la venta
        fue con promoción).
      </p>

      {creando && (
        <DevolucionForm
          ventas={datos.ventas}
          devoluciones={datos.devoluciones}
          clientes={datos.clientes}
          productos={datos.productos}
          alGuardar={guardar}
          alCerrar={() => setCreando(false)}
        />
      )}
    </>
  );
}
