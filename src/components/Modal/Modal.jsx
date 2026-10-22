import { useEffect, useId, useRef } from 'react';
import './Modal.css';

/**
 * Ventana emergente (componente "Ventana / Encabezado" en Figma).
 *
 * Uso:
 *   <Modal abierto={abierto} titulo="Nuevo usuario" alCerrar={() => setAbierto(false)}
 *          acciones={<Button>Crear usuario</Button>}>
 *     ...campos...
 *   </Modal>
 *
 * Se cierra con la tecla Esc, con el botón ✕ o dando clic fuera de la ventana.
 */
export default function Modal({ abierto, titulo, alCerrar, acciones, children }) {
  const idTitulo = useId();
  const ventana = useRef(null);

  // Guardamos la función de cerrar en una referencia para no reiniciar
  // el efecto de abajo cada vez que la pantalla se vuelve a dibujar.
  const cerrarRef = useRef(alCerrar);
  useEffect(() => {
    cerrarRef.current = alCerrar;
  }, [alCerrar]);

  useEffect(() => {
    if (!abierto) return undefined;

    // Cerrar con Esc
    const alPresionarTecla = (evento) => {
      if (evento.key === 'Escape') cerrarRef.current();
    };
    document.addEventListener('keydown', alPresionarTecla);

    // Evitar que la página de atrás se desplace y poner el foco en el primer campo
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const primerCampo =
      ventana.current?.querySelector('.modal__contenido :is(input, select, textarea)') ??
      ventana.current?.querySelector('button');
    primerCampo?.focus();

    return () => {
      document.removeEventListener('keydown', alPresionarTecla);
      document.body.style.overflow = overflowAnterior;
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="modal__fondo" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={idTitulo} ref={ventana}>
        <div className="modal__encabezado">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="modal__cerrar" onClick={alCerrar} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="modal__contenido">{children}</div>

        {acciones && <div className="modal__acciones">{acciones}</div>}
      </div>
    </div>
  );
}
