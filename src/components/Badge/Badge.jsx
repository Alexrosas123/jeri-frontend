import './Badge.css';

/**
 * Etiqueta de estado (componente "Etiqueta de estado" en Figma).
 *
 * Tipos: 'ok' (disponible / activo), 'alerta' (stock bajo / pendiente),
 *        'error' (agotado / rechazada), 'info' y 'neutro' (inactivo / vencida).
 *
 * Uso: <Badge tipo="alerta">Stock bajo</Badge>
 */
export default function Badge({ tipo = 'neutro', children }) {
  return <span className={`etiqueta etiqueta--${tipo}`}>{children}</span>;
}
