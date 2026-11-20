import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useLista from '../../hooks/useLista';
import { clientes as servicioClientes } from '../../services/clientes';
import { listarVentas } from '../../services/ventas';
import { formatearPesos } from '../../utils/formato';

const PERIODOS = [
  ['mes', 'Este mes'],
  ['trimestre', 'Últimos 3 meses'],
  ['anio', 'Este año'],
];

const MES_CORTO = new Intl.DateTimeFormat('es-MX', { month: 'short' });

async function cargar() {
  const [ventas, clientes] = await Promise.all([listarVentas(), servicioClientes.listar()]);
  return { ventas, clientes };
}

/** Fecha de inicio del periodo elegido */
function inicioDelPeriodo(periodo, hoy = new Date()) {
  if (periodo === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  if (periodo === 'trimestre') return new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
  return new Date(hoy.getFullYear(), 0, 1);
}

/**
 * Sección del Dashboard: top 10 de clientes por ingreso, cuántos clientes
 * generan ingreso y cuántos no, e ingresos de los últimos 6 meses.
 * Se calcula con las ventas y los clientes (funciona igual con el back-end).
 */
export default function ClientesIngreso() {
  const { datos, cargando, error } = useLista(cargar, { ventas: [], clientes: [] });
  const [periodo, setPeriodo] = useState('mes');

  const resumen = useMemo(() => {
    const inicio = inicioDelPeriodo(periodo);
    const ventas = datos.ventas.filter((v) => new Date(v.fecha) >= inicio);
    const porCliente = new Map();
    for (const v of ventas) {
      const c = porCliente.get(v.clienteId) ?? { total: 0, compras: 0 };
      c.total += v.total;
      c.compras += 1;
      porCliente.set(v.clienteId, c);
    }
    const ranking = [...porCliente.entries()]
      .map(([clienteId, c]) => ({ clienteId, ...c, nombre: datos.clientes.find((x) => x.id === clienteId)?.nombre ?? 'Cliente' }))
      .sort((a, b) => b.total - a.total);
    const ingresoTotal = ranking.reduce((s, c) => s + c.total, 0);
    const activos = datos.clientes.filter((c) => c.activo);
    const sinCompras = activos.filter((c) => !porCliente.has(c.id));
    const top3 = ranking.slice(0, 3).reduce((s, c) => s + c.total, 0);
    return {
      top10: ranking.slice(0, 10),
      ingresoTotal,
      activos: activos.length,
      conCompras: activos.length - sinCompras.length,
      sinCompras,
      porcentajeTop3: ingresoTotal ? Math.round((top3 / ingresoTotal) * 100) : 0,
    };
  }, [datos, periodo]);

  // Ingresos de los últimos 6 meses (no depende del periodo elegido)
  const meses = useMemo(() => {
    const hoy = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth() - 4 + i, 1);
      const total = datos.ventas.filter((v) => new Date(v.fecha) >= inicio && new Date(v.fecha) < fin).reduce((s, v) => s + v.total, 0);
      return { clave: inicio.toISOString(), etiqueta: MES_CORTO.format(inicio).replace('.', ''), total, actual: i === 5 };
    });
  }, [datos.ventas]);

  const maximoTop = resumen.top10[0]?.total || 1;
  const maximoMes = Math.max(...meses.map((m) => m.total), 1);
  const porcentajeCompran = resumen.activos ? Math.round((resumen.conCompras / resumen.activos) * 100) : 0;

  if (error) return <p className="dashboard__error" role="alert">{error}</p>;

  return (
    <section className="ingresos" aria-labelledby="titulo-ingresos">
      <div className="ingresos__encabezado">
        <h2 id="titulo-ingresos">Clientes e ingresos</h2>
        <div className="segmentado" role="radiogroup" aria-label="Periodo">
          {PERIODOS.map(([valor, texto]) => (
            <label key={valor} className={`segmentado__opcion ${periodo === valor ? 'segmentado__opcion--activa' : ''}`}>
              <input type="radio" name="periodo-dashboard" value={valor} checked={periodo === valor} onChange={() => setPeriodo(valor)} />
              {texto}
            </label>
          ))}
        </div>
      </div>

      {cargando ? (
        <p className="dashboard__cargando">Cargando clientes…</p>
      ) : (
        <div className="ingresos__rejilla">
          {/* ---- Top 10 ---- */}
          <article className="ingresos__tarjeta ingresos__tarjeta--top">
            <h3>Top 10 clientes por ingreso</h3>
            <p className="texto-secundario">Total vendido en el periodo: {formatearPesos(resumen.ingresoTotal)}</p>
            {resumen.top10.length === 0 ? (
              <p className="dashboard__sin-alertas">No hay ventas en este periodo.</p>
            ) : (
              <ol className="barras" aria-label="Top 10 clientes por ingreso">
                {resumen.top10.map((c, i) => (
                  <li
                    key={c.clienteId}
                    className="barras__fila"
                    title={`${c.nombre}: ${formatearPesos(c.total)} en ${c.compras} ${c.compras === 1 ? 'compra' : 'compras'}`}
                  >
                    <span className="barras__lugar">{i + 1}</span>
                    <div className="barras__cuerpo">
                      <div className="barras__texto">
                        <Link to={`/clientes/${c.clienteId}`} className="barras__nombre">{c.nombre}</Link>
                        <span className="barras__valor">{formatearPesos(c.total)}</span>
                      </div>
                      <div className="barras__pista" aria-hidden="true">
                        <span className="barras__barra" style={{ width: `${Math.max((c.total / maximoTop) * 100, 2)}%` }} />
                      </div>
                      <span className="texto-secundario">
                        {c.compras} {c.compras === 1 ? 'compra' : 'compras'} · {Math.round((c.total / resumen.ingresoTotal) * 100)} % del ingreso
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </article>

          {/* ---- Quién genera ingreso y quién no ---- */}
          <article className="ingresos__tarjeta">
            <h3>¿Quién genera ingreso?</h3>
            <p className="ingresos__cifra">
              <strong>{resumen.conCompras}</strong> de {resumen.activos} clientes activos compraron
            </p>
            <div
              className="medidor"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={resumen.activos}
              aria-valuenow={resumen.conCompras}
              aria-label="Clientes activos que compraron en el periodo"
              title={`${resumen.conCompras} con compras · ${resumen.sinCompras.length} sin compras`}
            >
              <span className="medidor__relleno" style={{ width: `${porcentajeCompran}%` }} />
            </div>
            <p className="texto-secundario">
              {porcentajeCompran} % con compras · {resumen.sinCompras.length} sin compras
              {resumen.ingresoTotal > 0 && ` · el top 3 genera el ${resumen.porcentajeTop3} % del ingreso`}
            </p>

            <h4 className="ingresos__subtitulo">Sin compras en el periodo ({resumen.sinCompras.length})</h4>
            {resumen.sinCompras.length === 0 ? (
              <p className="texto-secundario">Todos los clientes activos compraron.</p>
            ) : (
              <ul className="ingresos__lista">
                {resumen.sinCompras.map((c) => (
                  <li key={c.id}>
                    <Link to={`/clientes/${c.id}`}>{c.nombre}</Link>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* ---- Ingresos por mes ---- */}
          <article className="ingresos__tarjeta ingresos__tarjeta--ancha">
            <h3>Ingresos de los últimos 6 meses</h3>
            <ol className="columnas" aria-label="Ingresos por mes">
              {meses.map((m) => (
                <li key={m.clave} className="columnas__mes" title={`${m.etiqueta}: ${formatearPesos(m.total)}`}>
                  <span className="columnas__valor">{formatearPesos(m.total).replace('.00', '')}</span>
                  <div className="columnas__pista" aria-hidden="true">
                    <span
                      className={`columnas__barra ${m.actual ? 'columnas__barra--actual' : ''}`}
                      style={{ height: `${m.total ? Math.max((m.total / maximoMes) * 100, 3) : 0}%` }}
                    />
                  </div>
                  <span className="columnas__etiqueta">{m.etiqueta}{m.actual ? ' (actual)' : ''}</span>
                </li>
              ))}
            </ol>
          </article>
        </div>
      )}
    </section>
  );
}
