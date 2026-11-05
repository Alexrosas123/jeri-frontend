import './Table.css';

/**
 * Tabla con el estilo del sistema (filas de tabla en Figma).
 * Envuelve una <table> normal: tú escribes <thead> y <tbody> como siempre.
 * En pantallas chicas se puede desplazar hacia los lados.
 *
 * Uso:
 *   <Table etiqueta="Lista de usuarios">
 *     <thead><tr><th>Nombre</th></tr></thead>
 *     <tbody><tr><td>Ana</td></tr></tbody>
 *   </Table>
 */
export default function Table({ etiqueta, children }) {
  return (
    <div className="tabla">
      <div className="tabla__desplazable">
        <table aria-label={etiqueta}>{children}</table>
      </div>
    </div>
  );
}
