import { useState } from 'react';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';

/** Una lista (categorías o marcas) con un campo para agregar nuevas */
function ListaEditable({ titulo, elementos, alAgregar }) {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function agregar(evento) {
    evento.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return setError('Escribe un nombre.');
    if (elementos.some((e) => e.nombre.toLowerCase() === limpio.toLowerCase())) return setError('Ya existe.');
    setGuardando(true);
    try {
      await alAgregar(limpio);
      setNombre('');
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const idCampo = `nuevo-${titulo.toLowerCase()}`;

  return (
    <section className="cat-marcas__lista" aria-label={titulo}>
      <h3>{titulo} <span className="texto-secundario">({elementos.length})</span></h3>
      <ul>
        {elementos.map((e) => (
          <li key={e.id}>{e.nombre}</li>
        ))}
      </ul>
      <form className="cat-marcas__agregar" onSubmit={agregar} noValidate>
        <label htmlFor={idCampo} className="solo-lectores">Nueva {titulo.toLowerCase().replace(/s$/, '')}</label>
        <input
          id={idCampo}
          className={`campo__input ${error ? 'campo__input--error' : ''}`}
          placeholder={`Agregar ${titulo.toLowerCase().replace(/s$/, '')}`}
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setError('');
          }}
        />
        <Button type="submit" variante="secundario" disabled={guardando}>Agregar</Button>
      </form>
      {error && <p className="campo__error">{error}</p>}
    </section>
  );
}

/** Ventana para administrar categorías y marcas (RF-07) */
export default function CategoriasMarcas({ categorias, marcas, alAgregarCategoria, alAgregarMarca, alCerrar }) {
  return (
    <Modal
      abierto
      titulo="Categorías y marcas"
      alCerrar={alCerrar}
      acciones={<Button onClick={alCerrar}>Listo</Button>}
    >
      <div className="cat-marcas">
        <ListaEditable titulo="Categorías" elementos={categorias} alAgregar={alAgregarCategoria} />
        <ListaEditable titulo="Marcas" elementos={marcas} alAgregar={alAgregarMarca} />
      </div>
    </Modal>
  );
}
