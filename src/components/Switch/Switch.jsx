import './Switch.css';

/**
 * Interruptor ON / OFF (verde prendido, rojo apagado).
 *
 * Uso:
 *   <Switch activo={valor} alCambiar={(nuevo) => setValor(nuevo)} etiqueta="Dashboard para operador" />
 *
 * `etiqueta` es para lectores de pantalla (no se ve). `bloqueado` lo deja fijo y
 * `motivo` explica por qué al pasar el mouse.
 */
export default function Switch({ activo, alCambiar, etiqueta, bloqueado = false, motivo = '' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      aria-disabled={bloqueado || undefined}
      title={bloqueado ? motivo : undefined}
      className={`switch ${activo ? 'switch--on' : 'switch--off'} ${bloqueado ? 'switch--bloqueado' : ''}`}
      onClick={() => !bloqueado && alCambiar(!activo)}
    >
      <span className="switch__texto" aria-hidden="true">{activo ? 'ON' : 'OFF'}</span>
      <span className="switch__perilla" aria-hidden="true" />
    </button>
  );
}
