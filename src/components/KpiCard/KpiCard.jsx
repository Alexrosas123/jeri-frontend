import { Link } from 'react-router-dom';
import './KpiCard.css';

/**
 * Tarjeta de indicador (componente "Tarjeta / Indicador" en Figma).
 *
 * Uso:
 *   <KpiCard etiqueta="Ventas del mes" valor="$ 48,250.00" />
 *   <KpiCard etiqueta="Productos por resurtir" valor="4" tono="alerta" to="/inventario" />
 *
 * Si recibe `to`, toda la tarjeta funciona como enlace.
 */
export default function KpiCard({ etiqueta, valor, tono = 'normal', to }) {
  const contenido = (
    <>
      <span className="indicador__etiqueta">{etiqueta}</span>
      <span className={`indicador__valor indicador__valor--${tono}`}>{valor}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="indicador indicador--enlace">
        {contenido}
      </Link>
    );
  }
  return <div className="indicador">{contenido}</div>;
}
