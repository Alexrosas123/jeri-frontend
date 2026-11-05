import { useEffect } from 'react';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { formatearFecha } from '../../utils/formato';

/**
 * Ventana con el detalle de un reporte.
 * "Exportar PDF" abre la ventana de impresión del navegador, donde se elige "Guardar como PDF".
 */
export default function ReporteVentana({ reporte, rango, imprimir, alCerrar }) {
  useEffect(() => {
    if (!imprimir) return undefined;
    const temporizador = setTimeout(() => window.print(), 150); // esperamos a que la ventana se dibuje
    return () => clearTimeout(temporizador);
  }, [imprimir]);

  return (
    <Modal
      abierto
      amplio
      titulo={reporte.titulo}
      alCerrar={alCerrar}
      acciones={
        <>
          <Button variante="secundario" onClick={() => window.print()}>Exportar PDF</Button>
          <Button onClick={alCerrar}>Cerrar</Button>
        </>
      }
    >
      <div className="reporte-impreso">
        <p className="reporte__encabezado-impresion">Medidental JERI · {reporte.titulo}</p>
        <p className="texto-secundario">
          {reporte.nota ?? `Del ${formatearFecha(rango.inicio)} al ${formatearFecha(rango.fin)}`}
        </p>

        <dl className="reporte__resumen">
          {reporte.resumen.map((r) => (
            <div key={r.etiqueta}>
              <dt>{r.etiqueta}</dt>
              <dd>{r.valor}</dd>
            </div>
          ))}
        </dl>

        <div className="tabla">
          <div className="tabla__desplazable">
            <table aria-label={reporte.titulo}>
              <thead>
                <tr>
                  {reporte.columnas.map((c) => (
                    <th key={c.titulo} className={c.numero ? 'celda-numero' : undefined}>{c.titulo}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reporte.filas.length === 0 && (
                  <tr><td colSpan={reporte.columnas.length} className="tabla__vacia">{reporte.vacio}</td></tr>
                )}
                {reporte.filas.map((fila, i) => (
                  <tr key={i}>
                    {fila.map((celda, j) => (
                      <td key={j} className={reporte.columnas[j].numero ? 'celda-numero texto-mono' : undefined}>{celda}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
