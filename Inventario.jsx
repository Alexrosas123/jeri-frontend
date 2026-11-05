import { useMemo, useState } from 'react';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { obtenerInventario, registrarMovimiento, usaEjemplo } from '../../services/productos';
import { formatearFechaHora } from '../../utils/formato';
import { estadoExistencia } from '../../utils/inventario';
import MovimientoForm from './MovimientoForm';
import './Inventario.css';

/** Inventario · RF-08, RF-09, RF-10, RF-17 · CU-06, CU-08, CU-10 · Jira SCRUM-13 */
export default function Inventario() {
  const { datos, setDatos, cargando, error } = useLista(obtenerInventario, { productos: [], movimientos: [] });
  const { productos, movimientos } = datos;

  const [vista, setVista] = useState('existencias'); // 'existencias' | 'historial'
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'alerta' | 'agotado'
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [movimiento, setMovimiento] = useState(null); // null · { tipo, productoId }

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const { tipo } = estadoExistencia(p);
      if (filtro === 'alerta' && tipo === 'ok') return false;
      if (filtro === 'agotado' && tipo !== 'error') return false;
      if (!texto) return true;
      return p.nombre.toLowerCase().includes(texto) || p.sku.toLowerCase().includes(texto);
    });
  }, [productos, filtro, busqueda]);

  const porResurtir = productos.filter((p) => estadoExistencia(p).tipo !== 'ok').length;
  const nombreProducto = (id) => productos.find((p) => p.id === id)?.nombre ?? 'Producto eliminado';

  async function guardarMovimiento(valores) {
    const { producto, movimiento: nuevo } = await registrarMovimiento(valores);
    setDatos((anterior) => ({
      productos: anterior.productos.map((p) => (p.id === producto.id ? producto : p)),
      movimientos: [nuevo, ...anterior.movimientos],
    }));
    const verbo = nuevo.tipo === 'entrada' ? 'entrada' : 'salida';
    setMensaje(`Se registró la ${verbo} de ${nuevo.cantidad} · ${producto.nombre}. Existencia actual: ${producto.existencia}.`);
    setMovimiento(null);
  }

  return (
    <>
      <PageHeader
        titulo="Inventario"
        datosDeEjemplo={usaEjemplo}
        acciones={
          <>
            <Button variante="secundario" onClick={() => setMovimiento({ tipo: 'salida' })}>Registrar salida</Button>
            <Button onClick={() => setMovimiento({ tipo: 'entrada' })}>Registrar entrada</Button>
          </>
        }
      />

      {mensaje && <p className="mensaje mensaje--exito" role="status">{mensaje}</p>}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      {!cargando && porResurtir > 0 && (
        <p className="inventario__aviso">
          <strong>{porResurtir}</strong> {porResurtir === 1 ? 'producto necesita' : 'productos necesitan'} resurtirse.{' '}
          <button type="button" className="tabla__accion" onClick={() => { setVista('existencias'); setFiltro('alerta'); }}>
            Ver cuáles
          </button>
        </p>
      )}

      <div className="inventario__pestanas" role="tablist" aria-label="Vista de inventario">
        {[
          ['existencias', 'Existencias'],
          ['historial', 'Historial de movimientos'],
        ].map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={vista === valor}
            className={`inventario__pestana ${vista === valor ? 'inventario__pestana--activa' : ''}`}
            onClick={() => setVista(valor)}
          >
            {texto}
          </button>
        ))}
      </div>

      {vista === 'existencias' && (
        <>
          <div className="filtros">
            <label htmlFor="buscar-inventario" className="solo-lectores">Buscar producto</label>
            <input
              id="buscar-inventario"
              type="search"
              className="campo__input filtros__buscador"
              placeholder="Buscar por nombre o SKU"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <label htmlFor="filtro-inventario" className="solo-lectores">Estado</label>
            <select
              id="filtro-inventario"
              className="campo__input filtros__selector"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <option value="todos">Todos los productos</option>
              <option value="alerta">Por resurtir (stock bajo o agotado)</option>
              <option value="agotado">Solo agotados</option>
            </select>
          </div>

          <Table etiqueta="Existencias">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="celda-numero">Existencia</th>
                <th className="celda-numero">Mínimo</th>
                <th>Estado</th>
                <th><span className="solo-lectores">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={5} className="tabla__vacia">Cargando inventario…</td></tr>}
              {!cargando && visibles.length === 0 && (
                <tr><td colSpan={5} className="tabla__vacia">No hay productos con ese filtro.</td></tr>
              )}
              {visibles.map((p) => {
                const estado = estadoExistencia(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <p className="texto-principal">{p.nombre}</p>
                      <p className="texto-secundario texto-mono">{p.sku}</p>
                    </td>
                    <td className="celda-numero texto-mono">{p.existencia}</td>
                    <td className="celda-numero texto-mono texto-secundario">{p.stockMinimo}</td>
                    <td><Badge tipo={estado.tipo}>{estado.texto}</Badge></td>
                    <td className="celda-accion">
                      <button
                        type="button"
                        className="tabla__accion"
                        onClick={() => setMovimiento({ tipo: 'entrada', productoId: p.id })}
                      >
                        + Entrada<span className="solo-lectores"> de {p.nombre}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </>
      )}

      {vista === 'historial' && (
        <Table etiqueta="Historial de entradas y salidas">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Movimiento</th>
              <th className="celda-numero">Cantidad</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 && (
              <tr><td colSpan={5} className="tabla__vacia">Aún no hay movimientos registrados.</td></tr>
            )}
            {movimientos.map((m) => (
              <tr key={m.id}>
                <td className="texto-secundario">{formatearFechaHora(m.fecha)}</td>
                <td className="texto-principal">{nombreProducto(m.productoId)}</td>
                <td>
                  <Badge tipo={m.tipo === 'entrada' ? 'info' : 'neutro'}>
                    {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                  </Badge>{' '}
                  <span className="texto-secundario">{m.motivo}</span>
                </td>
                <td className={`celda-numero texto-mono ${m.tipo === 'entrada' ? 'inventario__mas' : 'inventario__menos'}`}>
                  {m.tipo === 'entrada' ? '+' : '−'}{m.cantidad}
                </td>
                <td className="texto-secundario">{m.nota || '—'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {movimiento && (
        <MovimientoForm
          tipo={movimiento.tipo}
          productoInicial={movimiento.productoId}
          productos={productos}
          alGuardar={guardarMovimiento}
          alCerrar={() => setMovimiento(null)}
        />
      )}
    </>
  );
}
