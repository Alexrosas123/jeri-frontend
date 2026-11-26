import { useState } from 'react';
import Button from '../../components/Button/Button';
import Switch from '../../components/Switch/Switch';
import Table from '../../components/Table/Table';
import usePermisos from '../../hooks/usePermisos';
import {
  cambiarPermiso,
  motivoBloqueo,
  nivelDelRol,
  PANTALLAS,
  restablecerPermisos,
} from '../../utils/permisos';

const NOMBRE_NIVEL = { gerencia: 'Gerencia', operador: 'Operador' };

/**
 * Tabla "Permisos por rol" con un switch ON / OFF por pantalla para Gerencia y Operador.
 * Al apagar un switch, esa pantalla desaparece del menú de ese nivel y no se puede abrir.
 */
export default function PermisosPorRol({ roles }) {
  const permisos = usePermisos();
  const [mensaje, setMensaje] = useState('');

  const rolesDe = (nivel) => roles.filter((r) => nivelDelRol(r.nombre) === nivel).map((r) => r.nombre).join(', ') || '—';
  const prendidas = (nivel) => Object.values(permisos[nivel]).filter(Boolean).length;

  function cambiar(nivel, pantalla, valor) {
    cambiarPermiso(nivel, pantalla.ruta, valor);
    setMensaje(`${pantalla.texto} quedó ${valor ? 'prendida' : 'apagada'} para ${NOMBRE_NIVEL[nivel]}.`);
  }

  function restablecer() {
    restablecerPermisos();
    setMensaje('Se restablecieron los permisos de fábrica.');
  }

  return (
    <section className="permisos" aria-labelledby="titulo-permisos">
      <div className="permisos__encabezado">
        <div>
          <h2 id="titulo-permisos" className="subtitulo-seccion">Permisos por rol</h2>
          <p className="formulario__nota">
            Prende o apaga cada pantalla. Lo que apagues desaparece del menú de ese nivel.
            <br />
            <strong>Gerencia:</strong> {rolesDe('gerencia')}. <strong>Operador:</strong> {rolesDe('operador')}.
          </p>
        </div>
        <Button variante="secundario" onClick={restablecer}>Restablecer</Button>
      </div>

      {mensaje && <p className="mensaje mensaje--exito" role="status">{mensaje}</p>}

      <Table etiqueta="Permisos por rol">
        <thead>
          <tr>
            <th>Pantalla</th>
            <th>Gerencia ({prendidas('gerencia')})</th>
            <th>Operador ({prendidas('operador')})</th>
          </tr>
        </thead>
        <tbody>
          {PANTALLAS.map((p) => (
            <tr key={p.ruta}>
              <td className="texto-principal">{p.texto}</td>
              {['gerencia', 'operador'].map((nivel) => {
                const motivo = motivoBloqueo(nivel, p.ruta, permisos);
                return (
                  <td key={nivel}>
                    <Switch
                      activo={Boolean(permisos[nivel][p.ruta])}
                      alCambiar={(valor) => cambiar(nivel, p, valor)}
                      etiqueta={`${p.texto} para ${NOMBRE_NIVEL[nivel]}`}
                      bloqueado={Boolean(motivo)}
                      motivo={motivo}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>

      <p className="formulario__nota">
        Por ahora los permisos se guardan en este navegador. Cuando el back-end los guarde, aplicarán para todas las
        computadoras. Gerencia siempre puede entrar a Usuarios para no quedarse sin acceso.
      </p>
    </section>
  );
}
