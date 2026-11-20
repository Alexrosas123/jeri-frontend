import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import KpiCard from '../../components/KpiCard/KpiCard';
import Modal from '../../components/Modal/Modal';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { clientes as servicioClientes } from '../../services/clientes';
import { listarCompras } from '../../services/compras';
import { listarDevoluciones } from '../../services/devoluciones';
import { obtenerCatalogo } from '../../services/productos';
import { proveedores as servicioProveedores } from '../../services/proveedores';
import { listarVentas, usaEjemplo } from '../../services/ventas';
import { aTextoFecha, estaEnRango, rangoDelPeriodo } from '../../utils/fechas';
import { formatearFecha, formatearPesos } from '../../utils/formato';
import '../Cotizaciones/Cotizaciones.css';
import '../Reportes/Reportes.css';
import '../Inventario/Inventario.css';

const PERIODOS = [
  { valor: 'mes', texto: 'Este mes' },
  { valor: 'mes-anterior', texto: 'Mes anterior' },
  { valor: 'anio', texto: 'Este año' },
  { valor: 'personalizado', texto: 'Personalizado' },
];

const VACIO = { ventas: [], compras: [], devoluciones: [], clientes: [], proveedores: [], productos: [] };

async function cargarPantalla() {
  const [ventas, compras, devoluciones, clientes, proveedores, catalogo] = await Promise.all([
    listarVentas(),
    listarCompras(),
    listarDevoluciones(),
    servicioClientes.listar(),
    servicioProveedores.listar(),
    obtenerCatalogo(),
  ]);
  return { ventas, compras, devoluciones, clientes, proveedores, productos: catalogo.productos };
}

const porFecha = (a, b) => new Date(b.fecha) - new Date(a.fecha);

/** Administración de ventas y compras en general (solo gerencia) */
export default function Administracion() {
  const { datos, cargando, error } = useLista(cargarPantalla, VACIO);
  const inicial = rangoDelPeriodo('mes');
  const [filtro, setFiltro] = useState({ periodo: 'mes', desde: aTextoFecha(inicial.inicio), hasta: aTextoFecha(inicial.fin) });
  const [rango, setRango] = useState(inicial);
  const [errorFiltro, setErrorFiltro] = useState('');
  const [pestana, setPestana] = useState('ventas'); // 'ventas' | 'compras' | 'devoluciones'
  const [busqueda, setBusqueda] = useState('');
  const [tipoVenta, setTipoVenta] = useState('todas'); // 'todas' | 'normal' | 'promocion'
  const [detalle, setDetalle] = useState(null); // { tipo: 'venta' | 'compra', registro }

  const nombreDe = (lista, id, respaldo) => lista.find((x) => x.id === id)?.nombre ?? respaldo;

  function cambiarPeriodo(periodo) {
    const nuevo = rangoDelPeriodo(periodo);
    setFiltro(nuevo ? { periodo, desde: aTextoFecha(nuevo.inicio), hasta: aTextoFecha(nuevo.fin) } : { ...filtro, periodo });
    setErrorFiltro('');
  }
  const cambiarFecha = (campo) => (e) => {
    setFiltro((anterior) => ({ ...anterior, periodo: 'personalizado', [campo]: e.target.value }));
    setErrorFiltro('');
  };
  function aplicar(evento) {
    evento.preventDefault();
    const nuevo = rangoDelPeriodo(filtro.periodo, filtro.desde, filtro.hasta);
    if (!nuevo) {
      setErrorFiltro('Revisa las fechas: “Desde” debe ser anterior o igual a “Hasta”.');
      return;
    }
    setRango(nuevo);
  }

  // Todo lo del periodo
  const periodo = useMemo(() => {
    const enRango = (lista) => lista.filter((x) => estaEnRango(x.fecha, rango)).sort(porFecha);
    return { ventas: enRango(datos.ventas), compras: enRango(datos.compras), devoluciones: enRango(datos.devoluciones) };
  }, [datos, rango]);

  const suma = (lista, campo = 'total') => lista.reduce((s, x) => s + (x[campo] ?? 0), 0);
  const totalVentas = suma(periodo.ventas);
  const totalDescuentos = suma(periodo.ventas, 'descuentoTotal');
  const totalDevoluciones = suma(periodo.devoluciones);
  const totalCompras = suma(periodo.compras);
  const balance = totalVentas - totalDevoluciones - totalCompras;

  // Filtro de texto y tipo para la pestaña activa
  const texto = busqueda.trim().toLowerCase();
  const coincide = (...valores) => !texto || valores.some((v) => v?.toLowerCase().includes(texto));
  const ventas = periodo.ventas.filter(
    (v) => (tipoVenta === 'todas' || v.tipo === tipoVenta) && coincide(v.folio, nombreDe(datos.clientes, v.clienteId, '')),
  );
  const compras = periodo.compras.filter((c) => coincide(c.folio, nombreDe(datos.proveedores, c.proveedorId, '')));
  const devoluciones = periodo.devoluciones.filter((d) => coincide(d.folio, d.ventaFolio, nombreDe(datos.clientes, d.clienteId, '')));

  const PESTANAS = [
    ['ventas', `Ventas (${periodo.ventas.length})`],
    ['compras', `Compras (${periodo.compras.length})`],
    ['devoluciones', `Devoluciones (${periodo.devoluciones.length})`],
  ];

  return (
    <>
      <PageHeader
        titulo="Administración de ventas y compras"
        descripcion="Todas las operaciones del periodo en un solo lugar."
        datosDeEjemplo={usaEjemplo}
      />

      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <form className="reportes__filtros" onSubmit={aplicar} noValidate>
        <Field etiqueta="Periodo" opciones={PERIODOS} placeholderOpcion="Seleccionar periodo" value={filtro.periodo} onChange={(e) => cambiarPeriodo(e.target.value || 'mes')} />
        <Field etiqueta="Desde" type="date" value={filtro.desde} onChange={cambiarFecha('desde')} />
        <Field etiqueta="Hasta" type="date" value={filtro.hasta} onChange={cambiarFecha('hasta')} />
        <Button type="submit">Aplicar</Button>
      </form>
      {errorFiltro && <p className="mensaje mensaje--error" role="alert">{errorFiltro}</p>}

      <section className="detalle__indicadores" aria-label="Resumen del periodo">
        <KpiCard etiqueta={`Ventas (${periodo.ventas.length})`} valor={formatearPesos(totalVentas)} />
        <KpiCard etiqueta="Descuentos otorgados" valor={formatearPesos(totalDescuentos)} />
        <KpiCard etiqueta={`Devoluciones (${periodo.devoluciones.length})`} valor={formatearPesos(totalDevoluciones)} />
        <KpiCard etiqueta={`Compras (${periodo.compras.length})`} valor={formatearPesos(totalCompras)} />
        <KpiCard etiqueta="Ventas − devoluciones − compras" valor={formatearPesos(balance)} tono={balance < 0 ? 'alerta' : 'normal'} />
      </section>

      <div className="inventario__pestanas" role="tablist" aria-label="Tipo de operación">
        {PESTANAS.map(([valor, textoPestana]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={pestana === valor}
            className={`inventario__pestana ${pestana === valor ? 'inventario__pestana--activa' : ''}`}
            onClick={() => setPestana(valor)}
          >
            {textoPestana}
          </button>
        ))}
      </div>

      <div className="filtros">
        <label htmlFor="buscar-operacion" className="solo-lectores">Buscar</label>
        <input
          id="buscar-operacion"
          type="search"
          className="campo__input filtros__buscador"
          placeholder={pestana === 'compras' ? 'Buscar por folio o proveedor' : 'Buscar por folio o cliente'}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {pestana === 'ventas' && (
          <>
            <label htmlFor="tipo-venta" className="solo-lectores">Tipo de venta</label>
            <select id="tipo-venta" className="campo__input filtros__selector" value={tipoVenta} onChange={(e) => setTipoVenta(e.target.value)}>
              <option value="todas">Normales y con promoción</option>
              <option value="normal">Solo ventas normales</option>
              <option value="promocion">Solo ventas con promoción</option>
            </select>
          </>
        )}
      </div>

      {pestana === 'ventas' && (
        <Table etiqueta="Ventas del periodo">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th className="celda-numero">Descuento</th>
              <th className="celda-numero">Total</th>
              <th><span className="solo-lectores">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={7} className="tabla__vacia">Cargando…</td></tr>}
            {!cargando && ventas.length === 0 && <tr><td colSpan={7} className="tabla__vacia">No hay ventas con estos filtros.</td></tr>}
            {ventas.map((v) => (
              <tr key={v.id}>
                <td className="texto-mono">{v.folio}</td>
                <td><Link to={`/clientes/${v.clienteId}`} className="texto-principal enlace-tabla">{nombreDe(datos.clientes, v.clienteId, 'Cliente')}</Link></td>
                <td className="texto-secundario">{formatearFecha(v.fecha)}</td>
                <td>{v.tipo === 'promocion' ? <Badge tipo="info">Con promoción</Badge> : <Badge tipo="neutro">Normal</Badge>}</td>
                <td className="celda-numero texto-mono">{v.descuentoTotal > 0 ? `−${formatearPesos(v.descuentoTotal)}` : '—'}</td>
                <td className="celda-numero texto-mono">{formatearPesos(v.total)}</td>
                <td className="celda-accion">
                  <button type="button" className="tabla__accion" onClick={() => setDetalle({ tipo: 'venta', registro: v })}>
                    Ver<span className="solo-lectores"> {v.folio}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {pestana === 'compras' && (
        <Table etiqueta="Compras del periodo">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th className="celda-numero">Total</th>
              <th><span className="solo-lectores">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={6} className="tabla__vacia">Cargando…</td></tr>}
            {!cargando && compras.length === 0 && <tr><td colSpan={6} className="tabla__vacia">No hay compras con estos filtros.</td></tr>}
            {compras.map((c) => (
              <tr key={c.id}>
                <td className="texto-mono">{c.folio}</td>
                <td className="texto-principal">{nombreDe(datos.proveedores, c.proveedorId, 'Proveedor')}</td>
                <td className="texto-secundario">{formatearFecha(c.fecha)}</td>
                <td>{c.recibida ? <Badge tipo="ok">Recibida</Badge> : <Badge tipo="alerta">Por recibir</Badge>}</td>
                <td className="celda-numero texto-mono">{formatearPesos(c.total)}</td>
                <td className="celda-accion">
                  <button type="button" className="tabla__accion" onClick={() => setDetalle({ tipo: 'compra', registro: c })}>
                    Ver<span className="solo-lectores"> {c.folio}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {pestana === 'devoluciones' && (
        <Table etiqueta="Devoluciones del periodo">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Venta · Cliente</th>
              <th>Fecha</th>
              <th>Motivo</th>
              <th className="celda-numero">Reembolso</th>
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={5} className="tabla__vacia">Cargando…</td></tr>}
            {!cargando && devoluciones.length === 0 && <tr><td colSpan={5} className="tabla__vacia">No hay devoluciones con estos filtros.</td></tr>}
            {devoluciones.map((d) => (
              <tr key={d.id}>
                <td className="texto-mono">{d.folio}</td>
                <td>
                  <p className="texto-mono">{d.ventaFolio}</p>
                  <p className="texto-secundario">{nombreDe(datos.clientes, d.clienteId, 'Cliente')}</p>
                </td>
                <td className="texto-secundario">{formatearFecha(d.fecha)}</td>
                <td className="texto-secundario">{d.motivo}</td>
                <td className="celda-numero texto-mono">{formatearPesos(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {detalle && (
        <Modal
          abierto
          amplio
          titulo={`${detalle.tipo === 'venta' ? 'Venta' : 'Compra'} ${detalle.registro.folio}`}
          alCerrar={() => setDetalle(null)}
          acciones={<Button onClick={() => setDetalle(null)}>Cerrar</Button>}
        >
          <div className="cotizacion__detalle">
            <dl className="cotizacion__datos">
              {detalle.tipo === 'venta' ? (
                <>
                  <div><dt>Cliente</dt><dd>{nombreDe(datos.clientes, detalle.registro.clienteId, 'Cliente')}</dd></div>
                  <div><dt>Tipo</dt><dd>{detalle.registro.tipo === 'promocion' ? 'Con promoción' : 'Normal'}</dd></div>
                  <div><dt>Entrega</dt><dd>{detalle.registro.direccionEntrega || 'Recoge en mostrador'}</dd></div>
                </>
              ) : (
                <>
                  <div><dt>Proveedor</dt><dd>{nombreDe(datos.proveedores, detalle.registro.proveedorId, 'Proveedor')}</dd></div>
                  <div><dt>Estado</dt><dd>{detalle.registro.recibida ? 'Recibida' : 'Por recibir'}</dd></div>
                </>
              )}
              <div><dt>Fecha</dt><dd>{formatearFecha(detalle.registro.fecha)}</dd></div>
            </dl>
            <div className="tabla">
              <div className="tabla__desplazable">
                <table aria-label={`Productos de ${detalle.registro.folio}`}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="celda-numero">Cantidad</th>
                      {detalle.tipo === 'venta' && <th className="celda-numero">Precio lista</th>}
                      {detalle.tipo === 'venta' && <th className="celda-numero">Descuento</th>}
                      <th className="celda-numero">{detalle.tipo === 'venta' ? 'Precio final' : 'Costo'}</th>
                      <th className="celda-numero">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.registro.lineas.map((l) => (
                      <tr key={l.productoId}>
                        <td className="texto-principal">{nombreDe(datos.productos, l.productoId, 'Producto')}</td>
                        <td className="celda-numero texto-mono">{l.cantidad}</td>
                        {detalle.tipo === 'venta' && <td className="celda-numero texto-mono">{formatearPesos(l.precioLista)}</td>}
                        {detalle.tipo === 'venta' && <td className="celda-numero texto-mono">{l.descuento > 0 ? `${l.descuento} %` : '—'}</td>}
                        <td className="celda-numero texto-mono">{formatearPesos(l.precio)}</td>
                        <td className="celda-numero texto-mono">{formatearPesos(l.cantidad * l.precio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="cotizacion__total">
              Total: <strong className="texto-mono">{formatearPesos(detalle.registro.total)}</strong>
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
