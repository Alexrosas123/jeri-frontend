import { useMemo, useState } from 'react';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { clientes as servicioClientes } from '../../services/clientes';
import { obtenerCatalogo } from '../../services/productos';
import {
  actualizarPromocion,
  crearPromocion,
  estadoPromocion,
  listarPromociones,
  usaEjemplo,
} from '../../services/promociones';
import { formatearFecha } from '../../utils/formato';
import { estaVisible } from '../../utils/inventario';
import PromocionForm from './PromocionForm';

const ESTADOS = {
  vigente: { texto: 'Vigente', tipo: 'ok' },
  programada: { texto: 'Programada', tipo: 'info' },
  vencida: { texto: 'Vencida', tipo: 'neutro' },
  pausada: { texto: 'En pausa', tipo: 'alerta' },
};

async function cargarPantalla() {
  const [promociones, clientes, catalogo] = await Promise.all([listarPromociones(), servicioClientes.listar(), obtenerCatalogo()]);
  return { promociones, clientes, productos: catalogo.productos };
}

/** "2026-11-20" → fecha legible (sin problemas de zona horaria) */
const fechaCorta = (texto) => formatearFecha(`${texto}T12:00:00`);

/** Descuentos y promociones por cliente y por producto */
export default function Promociones() {
  const { datos, setDatos, cargando, error } = useLista(cargarPantalla, { promociones: [], clientes: [], productos: [] });
  const [filtro, setFiltro] = useState('todas');
  const [formulario, setFormulario] = useState(null); // null · 'nueva' · promoción a editar
  const [mensaje, setMensaje] = useState('');

  const nombreDe = (lista, id, todos) => (id == null ? todos : lista.find((x) => x.id === id)?.nombre ?? '—');

  const visibles = useMemo(
    () => datos.promociones.filter((p) => filtro === 'todas' || estadoPromocion(p) === filtro),
    [datos.promociones, filtro],
  );

  async function guardar(valores) {
    if (formulario === 'nueva') {
      const nueva = await crearPromocion(valores);
      setDatos((anterior) => ({ ...anterior, promociones: [nueva, ...anterior.promociones] }));
      setMensaje(`Se registró la promoción “${nueva.nombre}”.`);
    } else {
      const actualizada = await actualizarPromocion(formulario.id, valores);
      setDatos((anterior) => ({
        ...anterior,
        promociones: anterior.promociones.map((p) => (p.id === actualizada.id ? actualizada : p)),
      }));
      setMensaje(`Se guardaron los cambios de “${actualizada.nombre}”.`);
    }
    setFormulario(null);
  }

  return (
    <>
      <PageHeader
        titulo="Promociones y descuentos"
        descripcion="Descuentos por cliente, por producto o precio especial de un producto para un cliente."
        datosDeEjemplo={usaEjemplo}
        acciones={<Button onClick={() => setFormulario('nueva')} disabled={cargando}>Nueva promoción</Button>}
      />

      {mensaje && <p className="mensaje mensaje--exito" role="status">{mensaje}</p>}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <div className="filtros">
        <label htmlFor="filtro-promocion" className="solo-lectores">Estado</label>
        <select id="filtro-promocion" className="campo__input filtros__selector" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="todas">Todas las promociones</option>
          <option value="vigente">Vigentes</option>
          <option value="programada">Programadas</option>
          <option value="vencida">Vencidas</option>
          <option value="pausada">En pausa</option>
        </select>
      </div>

      <Table etiqueta="Promociones">
        <thead>
          <tr>
            <th>Promoción</th>
            <th>Cliente</th>
            <th>Producto</th>
            <th className="celda-numero">Descuento</th>
            <th>Vigencia</th>
            <th>Estado</th>
            <th><span className="solo-lectores">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {cargando && <tr><td colSpan={7} className="tabla__vacia">Cargando promociones…</td></tr>}
          {!cargando && visibles.length === 0 && (
            <tr><td colSpan={7} className="tabla__vacia">No hay promociones con ese filtro.</td></tr>
          )}
          {visibles.map((p) => {
            const estado = ESTADOS[estadoPromocion(p)];
            return (
              <tr key={p.id}>
                <td className="texto-principal">{p.nombre}</td>
                <td className="texto-secundario">{nombreDe(datos.clientes, p.clienteId, 'Todos los clientes')}</td>
                <td className="texto-secundario">{nombreDe(datos.productos, p.productoId, 'Todos los productos')}</td>
                <td className="celda-numero texto-mono">{p.porcentaje} %</td>
                <td className="texto-secundario">{fechaCorta(p.desde)} – {fechaCorta(p.hasta)}</td>
                <td><Badge tipo={estado.tipo}>{estado.texto}</Badge></td>
                <td className="celda-accion">
                  <button type="button" className="tabla__accion" onClick={() => setFormulario(p)}>
                    Editar<span className="solo-lectores"> {p.nombre}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <p className="formulario__nota">
        Las promociones vigentes se aplican al registrar una <strong>venta con promoción</strong>. Si a un producto le aplican
        varias, se usa la de mayor descuento.
      </p>

      {formulario && (
        <PromocionForm
          promocion={formulario === 'nueva' ? null : formulario}
          clientes={datos.clientes}
          productos={datos.productos.filter(estaVisible)}
          alGuardar={guardar}
          alCerrar={() => setFormulario(null)}
        />
      )}
    </>
  );
}
