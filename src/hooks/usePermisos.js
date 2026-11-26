import { useSyncExternalStore } from 'react';
import { obtenerPermisos, suscribirPermisos } from '../utils/permisos';

/**
 * Regresa los permisos actuales y vuelve a dibujar el componente cuando
 * alguien prende o apaga un switch (por ejemplo, el menú lateral).
 */
export default function usePermisos() {
  return useSyncExternalStore(suscribirPermisos, obtenerPermisos);
}
