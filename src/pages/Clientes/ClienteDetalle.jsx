import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../../components/Badge/Badge';
import Button, { BotonEnlace } from '../../components/Button/Button';
import ContactoForm from '../../components/ContactoForm/ContactoForm';
import KpiCard from '../../components/KpiCard/KpiCard';
import PageHeader from '../../components/PageHeader/PageHeader';
import Table from '../../components/Table/Table';
import useLista from '../../hooks/useLista';
import { clientes as servicio, direccionesDe } from '../../services/clientes';
import { obtenerCatalogo } from '../../services/productos';
import { listarVentas, usaEjemplo } from '../../services/ventas';
import { formatearFecha, formatearPesos } from '../../utils/formato';

async function cargarPantalla() {
  const [clientes, ventas, catalogo] = await Promise.all([servicio.listar(), listarVentas(), obtenerCatalogo()]);
  return { clientes, ventas, productos: catalogo.productos };
}

/** Detalle de un cliente: datos, direcciones de entrega, historial y productos que más compra */
export default function ClienteDetalle() {
  const { id } = useParams();
  const { datos, setDatos, cargando, error } = useLista(cargarPantalla, { clientes: [], ventas: [], productos: [] });
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cliente = datos.clientes.find((c) => c.id === Number(id));
  const nombreProducto = (productoId) => datos.productos.find((p) => p.id === productoId)?.nombre ?? 'Producto';

  if (cargando) return <p className="texto-secundario">Cargando cliente…</p>;
  if (!cliente) {
    return (
      <>
        <PageHeader titulo="Cliente no encontrado" />
        <p>Este cliente no existe.</p>
        <BotonEnlace to="/clientes" variante="secundario">← Volver a clientes</BotonEnlace>
      </>
    );
  }

  // Historial de compras del cliente (más reciente primero)
  const ventas = datos.ventas
    .filter((v) => v.clienteId === cliente.id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const totalComprado = ventas.reduce((s, v) => s + v.total, 0);

  // Productos que más compra: unidades, importe y en cuántas compras aparece
  const porProducto = new Map();
  for (const v of ventas) {
    for (const l of v.lineas) {
      const p = porProducto.get(l.productoId) ?? { unidades: 0, importe: 0, veces: 0 };
      p.unidades += l.cantidad;
      p.importe += l.cantidad * l.precio;
      p.veces += 1;
      porProducto.set(l.productoId, p);
    }
  }
  const masComprados = [...porProducto.entries()].sort((a, b) => b[1].unidades - a[1].unidades).slice(0, 10);
  const direcciones = direccionesDe(cliente);

  async function guardar(valores) {
    const actualizado = await servicio.actualizar(cliente.id, valores);
    setDatos((anterior) => ({ ...anterior, clientes: anterior.clientes.map((c) => (c.id === actualizado.id ? actualizado : c)) }));
    setEditando(false);
    setMensaje('Se guardaron los cambios del cliente.');
  }

  return (
    <>
      <div className="detalle__volver">
        <BotonEnlace to="/clientes" variante="secundario">← Volver a clientes</BotonEnlace>
      </div>

      <PageHeader
        titulo={cliente.nombre}
        descripcion={`RFC ${cliente.rfc}`}
        datosDeEjemplo={usaEjemplo}
        acciones={<Button onClick={() => setEditando(true)}>Editar cliente</Button>}
      />

      {mensaje && <p className="mensaje mensaje--exito" role="status">{mensaje}</p>}
      {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}

      <section className="detalle__indicadores" aria-label="Resumen del cliente">
        <KpiCard etiqueta="Total comprado" valor={formatearPesos(totalComprado)} />
        <KpiCard etiqueta="Compras realizadas" valor={ventas.length} />
        <KpiCard etiqueta="Compra promedio" valor={formatearPesos(ventas.length ? totalComprado / ventas.length : 0)} />
        <KpiCard etiqueta="Última compra" valor={ventas.length ? formatearFecha(ventas[0].fecha) : '—'} />
      </section>

      <section className="detalle__tarjeta" aria-labelledby="titulo-datos-cliente">
        <h2 id="titulo-datos-cliente">Datos del cliente</h2>
        <dl className="detalle__datos">
          <div><dt>Teléfono</dt><dd>{cliente.telefono || '—'}</dd></div>
          <div><dt>Correo</dt><dd>{cliente.correo || '—'}</dd></div>
          <div><dt>Estado</dt><dd><Badge tipo={cliente.activo ? 'ok' : 'neutro'}>{cliente.activo ? 'Activo' : 'Inactivo'}</Badge></dd></div>
        </dl>
        <div>
          <p className="campo__etiqueta">Direcciones de entrega ({direcciones.length})</p>
          {direcciones.length === 0 ? (
            <p className="texto-secundario">Sin direcciones registradas. Agrégalas con “Editar cliente”.</p>
          ) : (
            <ol className="lista-direcciones">
              {direcciones.map((d) => <li key={d}>{d}</li>)}
            </ol>
          )}
        </div>
      </section>

      <div className="detalle__columnas">
        <section className="detalle__seccion" aria-labelledby="titulo-mas-comprados">
          <h2 id="titulo-mas-comprados">Productos que más compra</h2>
          <Table etiqueta="Productos que más compra el cliente">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="celda-numero">Unidades</th>
                <th className="celda-numero">Importe</th>
              </tr>
            </thead>
            <tbody>
              {masComprados.length === 0 && (
                <tr><td colSpan={3} className="tabla__vacia">Este cliente aún no tiene compras.</td></tr>
              )}
              {masComprados.map(([productoId, p]) => (
                <tr key={productoId}>
                  <td>
                    <Link to={`/productos/${productoId}`} className="texto-principal enlace-tabla">{nombreProducto(productoId)}</Link>
                    <p className="texto-secundario">En {p.veces} {p.veces === 1 ? 'compra' : 'compras'}</p>
                  </td>
                  <td className="celda-numero texto-mono">{p.unidades}</td>
                  <td className="celda-numero texto-mono">{formatearPesos(p.importe)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        <section className="detalle__seccion" aria-labelledby="titulo-historial-cliente">
          <h2 id="titulo-historial-cliente">Historial de compras</h2>
          <Table etiqueta="Historial de compras del cliente">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th className="celda-numero">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 && (
                <tr><td colSpan={3} className="tabla__vacia">Este cliente aún no tiene compras.</td></tr>
              )}
              {ventas.map((v) => (
                <tr key={v.id}>
                  <td>
                    <p className="texto-mono">{v.folio}</p>
                    <p className="texto-secundario">
                      {v.lineas.length} {v.lineas.length === 1 ? 'producto' : 'productos'}
                      {v.cotizacionId ? ' · desde cotización' : ''}
                    </p>
                    {v.direccionEntrega && <p className="texto-secundario">Entrega: {v.direccionEntrega}</p>}
                  </td>
                  <td className="texto-secundario">{formatearFecha(v.fecha)}</td>
                  <td className="celda-numero texto-mono">{formatearPesos(v.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      </div>

      {editando && (
        <ContactoForm
          tipo="cliente"
          conDirecciones
          registro={cliente}
          existentes={datos.clientes}
          alGuardar={guardar}
          alCerrar={() => setEditando(false)}
        />
      )}
    </>
  );
}
