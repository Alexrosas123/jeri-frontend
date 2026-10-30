import { useEffect, useState } from 'react';

/**
 * Carga una lista una sola vez al abrir la pantalla.
 *
 * Uso:
 *   const { datos, setDatos, cargando, error } = useLista(() => clientes.listar(), []);
 *
 * `cargar` es la función que pide la información; `inicial` es el valor mientras carga.
 */
export default function useLista(cargar, inicial) {
  const [datos, setDatos] = useState(inicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    cargar()
      .then((resultado) => activo && setDatos(resultado))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false; // si el usuario se va de la pantalla antes de que termine, no actualizamos nada
    };
    // Solo se carga al abrir la pantalla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { datos, setDatos, cargando, error };
}
