/**
 * Pantalla provisional para las opciones del menú que todavía no se programan.
 * Se irá reemplazando por cada pantalla real (Dashboard, Clientes, etc.).
 */
export default function EnConstruccion({ titulo, requerimientos }) {
  return (
    <>
      <span className="aviso-vista-previa">En construcción</span>
      <h1 style={{ fontSize: 28 }}>{titulo}</h1>
      <p style={{ color: 'var(--color-texto-suave)', maxWidth: 560 }}>
        Esta pantalla ya está diseñada en Figma{requerimientos ? ` (${requerimientos})` : ''} y está pendiente de
        programar.{' '}
        <a href="https://www.figma.com/design/Ers1oxsks6TMnhkUB5U0cF" target="_blank" rel="noreferrer">
          Ver diseño en Figma
        </a>
      </p>
    </>
  );
}
