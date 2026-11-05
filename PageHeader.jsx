import './PageHeader.css';

/**
 * Encabezado de cada pantalla: título a la izquierda y botones a la derecha.
 *
 * Uso:
 *   <PageHeader titulo="Dashboard" datosDeEjemplo acciones={<Button>Nueva venta</Button>} />
 *
 * `datosDeEjemplo` muestra la etiqueta "Vista previa · datos de ejemplo"
 * mientras la pantalla no esté conectada al back-end.
 */
export default function PageHeader({ titulo, descripcion, acciones, datosDeEjemplo = false }) {
  return (
    <header className="encabezado-pagina">
      <div className="encabezado-pagina__texto">
        {datosDeEjemplo && <span className="aviso-vista-previa">Vista previa · datos de ejemplo</span>}
        <h1 className="encabezado-pagina__titulo">{titulo}</h1>
        {descripcion && <p className="encabezado-pagina__descripcion">{descripcion}</p>}
      </div>
      {acciones && <div className="encabezado-pagina__acciones">{acciones}</div>}
    </header>
  );
}
