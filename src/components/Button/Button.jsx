import './Button.css';

/**
 * Botón del sistema (componente "Botón" en Figma).
 *
 * Uso:
 *   <Button>Guardar</Button>
 *   <Button variante="secundario" onClick={cancelar}>Cancelar</Button>
 *   <Button type="submit" anchoCompleto>Iniciar sesión</Button>
 */
export default function Button({
  variante = 'primario', // 'primario' | 'secundario'
  anchoCompleto = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  const clases = ['boton', `boton--${variante}`, anchoCompleto && 'boton--ancho-completo', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={clases} {...props}>
      {children}
    </button>
  );
}
