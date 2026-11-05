import { useMemo, useState } from 'react';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import PageHeader from '../../components/PageHeader/PageHeader';
import useLista from '../../hooks/useLista';
import { obtenerDatosReportes, usaEjemplo } from '../../services/reportes';
import { aTextoFecha, rangoDelPeriodo } from '../../utils/fechas';
import { construirReporte, REPORTES } from '../../utils/reportes';
import ReporteVentana from './ReporteVentana';
import './Reportes.css';

const PERIODOS = [
  { valor: 'mes', texto: 'Este mes' },
  { valor: 'mes-anterior', texto: 'Mes anterior' },
  { valor: 'anio', texto: 'Este año' },
  { valor: 'personalizado', texto: 'Personalizado' },
];

const DATOS_VACIOS = { ventas: [], compras: [], cotizaciones: [], productos: [], movimientos: [], clientes: [], proveedores: [] };

/** Reportes · RF-18 */
export default function Reportes() {
  const { datos, cargando, error } = useLista(obtenerDatosReportes, DATOS_VACIOS);

  const inicial = rangoDelPeriodo('mes');
  const [filtro, setFiltro] = useState({ periodo: 'mes', desde: aTextoFecha(inicial.inicio), hasta: aTextoFecha(inicial.fin) });
  const [rango, setRango] = useState(inicial); // el periodo que se aplicó con el botón "Aplicar"
  const [errorFiltro, setErrorFiltro] = useState('');
  const [abierto, setAbierto] = useState(null); // { id, imprimir }

  function cambiarPeriodo(periodo) {
    const nuevo = rangoDelPeriodo(periodo);
    setFiltro(nuevo ? { periodo, desde: aTextoFecha(nuevo.inicio), hasta: aTextoFecha(nuevo.fin) } : { ...filtro, periodo });
    setErrorFiltro('');
  }

  // Si el usuario escribe una fecha, el periodo pasa a "Personalizado"
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

  const reportes = useMemo(
    () => (cargando ? [] : REPORTES.map((r) => ({ ...r, ...construirReporte(r.id, datos, rango) }))),
    [datos, rango, cargando],
  );
  const reporteAbierto = abierto && reportes.find((r) => r.id === abierto.id);

  return (
    <>
      <PageHeader titulo="Reportes" datosDeEjemplo={usaEjemplo} />

      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <form className="reportes__filtros" onSubmit={aplicar} noValidate>
        <Field
          etiqueta="Periodo"
          opciones={PERIODOS}
          placeholderOpcion="Seleccionar periodo"
          value={filtro.periodo}
          onChange={(e) => cambiarPeriodo(e.target.value || 'mes')}
        />
        <Field etiqueta="Desde" type="date" value={filtro.desde} onChange={cambiarFecha('desde')} max={filtro.hasta || undefined} />
        <Field etiqueta="Hasta" type="date" value={filtro.hasta} onChange={cambiarFecha('hasta')} min={filtro.desde || undefined} />
        <Button type="submit">Aplicar</Button>
      </form>
      {errorFiltro && <p className="mensaje mensaje--error" role="alert">{errorFiltro}</p>}

      <div className="reportes__tarjetas">
        {cargando && <p className="texto-secundario">Cargando reportes…</p>}
        {reportes.map((r) => (
          <article key={r.id} className="reporte">
            <h2>{r.titulo}</h2>
            <p className="reporte__descripcion">{r.descripcion}</p>
            <p className="reporte__dato">
              <span>{r.resumen[0].etiqueta}:</span> <strong>{r.resumen[0].valor}</strong>
            </p>
            <div className="reporte__acciones">
              <button type="button" className="tabla__accion" onClick={() => setAbierto({ id: r.id, imprimir: false })}>
                Ver reporte<span className="solo-lectores"> {r.titulo}</span>
              </button>
              <button type="button" className="tabla__accion" onClick={() => setAbierto({ id: r.id, imprimir: true })}>
                Exportar PDF<span className="solo-lectores"> {r.titulo}</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {reporteAbierto && (
        <ReporteVentana
          reporte={reporteAbierto}
          rango={rango}
          imprimir={abierto.imprimir}
          alCerrar={() => setAbierto(null)}
        />
      )}
    </>
  );
}
