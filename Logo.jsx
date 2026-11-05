/**
 * Logo del sistema: diente dentro de un cuadro blanco con esquinas redondeadas.
 * `tamano` es el lado del cuadro en píxeles.
 */
export default function Logo({ tamano = 36 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: tamano,
        height: tamano,
        borderRadius: tamano * 0.28,
        background: '#fff',
        display: 'inline-grid',
        placeItems: 'center',
        flex: 'none',
      }}
    >
      <svg viewBox="0 0 24 24" width={tamano * 0.6} height={tamano * 0.6}>
        <path
          fill="var(--color-primario)"
          d="M12 3c-1.5-1-3.5-1.4-5.2-.6C4.6 3.4 3.6 5.8 4.2 8.3c.4 1.7.9 3.3 1.2 5 .4 2.4.6 5 1.6 7.2.4.9 1.7.9 2 0 .6-1.7.9-3.6 1.4-5.3.3-1 1-1.2 1.6-1.2s1.3.2 1.6 1.2c.5 1.7.8 3.6 1.4 5.3.3.9 1.6.9 2 0 1-2.2 1.2-4.8 1.6-7.2.3-1.7.8-3.3 1.2-5 .6-2.5-.4-4.9-2.6-5.9C15.5 1.6 13.5 2 12 3z"
        />
      </svg>
    </span>
  );
}
