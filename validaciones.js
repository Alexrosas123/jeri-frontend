// Reglas de validación que comparten varios formularios

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// RFC de persona moral (3 letras) o física (4 letras) + fecha AAMMDD + homoclave de 3 caracteres
const FORMATO_RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

export function esCorreoValido(correo) {
  return FORMATO_CORREO.test(correo.trim());
}

export function esRfcValido(rfc) {
  return FORMATO_RFC.test(rfc.trim().toUpperCase());
}

/** Acepta "55 1234 5678", "5512345678" o "55-1234-5678": deben quedar 10 dígitos */
export function esTelefonoValido(telefono) {
  return telefono.replace(/[\s-]/g, '').match(/^\d{10}$/) !== null;
}

/** Quita espacios al inicio y al final de todos los textos de un objeto */
export function limpiarTextos(datos) {
  return Object.fromEntries(
    Object.entries(datos).map(([clave, valor]) => [clave, typeof valor === 'string' ? valor.trim() : valor]),
  );
}
