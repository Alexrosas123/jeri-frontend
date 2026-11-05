import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import { BotonEnlace } from '../../components/Button/Button';
import KpiCard from '../../components/KpiCard/KpiCard';
import PageHeader from '../../components/PageHeader/PageHeader';
import { obtenerDashboard } from '../../services/dashboard';
import { formatearPesos } from '../../utils/formato';
import './Dashboard.css';

/** Decide la etiqueta de cada alerta según la existencia */
function estadoDeAlerta({ existencia }) {
  return existencia === 0 ? { tipo: 'error', texto: 'Agotado' } : { tipo: 'alerta', texto: 'Stock bajo' };
}

/** Dashboard · RF-21 (indicadores) y RF-17 (alertas de inventario) · Jira SCRUM-6 */
export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  // Al abrir la pantalla, pedimos los datos una sola vez
  useEffect(() => {
    let activo = true;
    obtenerDashboard()
      .then((respuesta) => activo && setDatos(respuesta))
      .catch((e) => activo && setError(e.message));
    return () => {
      activo = false; // evita actualizar si el usuario ya se fue de la pantalla
    };
  }, []);

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        datosDeEjemplo={datos?.esEjemplo}
        acciones={
          <>
            <BotonEnlace to="/compras" variante="secundario">
              Nueva compra
            </BotonEnlace>
            <BotonEnlace to="/ventas">Nueva venta</BotonEnlace>
          </>
        }
      />

      {error && (
        <p className="dashboard__error" role="alert">
          {error}
        </p>
      )}

      {!datos && !error && <p className="dashboard__cargando">Cargando información…</p>}

      {datos && (
        <>
          <section className="dashboard__indicadores" aria-label="Indicadores del mes">
            <KpiCard etiqueta="Ventas del mes" valor={formatearPesos(datos.resumen.ventasMes)} />
            <KpiCard etiqueta="Compras del mes" valor={formatearPesos(datos.resumen.comprasMes)} />
            <KpiCard
              etiqueta="Productos por resurtir"
              valor={datos.resumen.productosPorResurtir}
              tono={datos.resumen.productosPorResurtir > 0 ? 'alerta' : 'normal'}
              to="/inventario"
            />
          </section>

          <section className="dashboard__alertas" aria-labelledby="titulo-alertas">
            <div className="dashboard__alertas-encabezado">
              <h2 id="titulo-alertas">Alertas de inventario</h2>
              <Link to="/inventario">Ver inventario</Link>
            </div>

            {datos.alertas.length === 0 ? (
              <p className="dashboard__sin-alertas">Todos los productos tienen existencias suficientes.</p>
            ) : (
              <ul className="dashboard__lista">
                {datos.alertas.map((alerta) => {
                  const estado = estadoDeAlerta(alerta);
                  return (
                    <li key={alerta.id} className="dashboard__alerta">
                      <div>
                        <p className="dashboard__producto">{alerta.producto}</p>
                        <p className="dashboard__detalle">
                          Existencia {alerta.existencia} · Stock mínimo {alerta.stockMinimo}
                        </p>
                      </div>
                      <Badge tipo={estado.tipo}>{estado.texto}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
