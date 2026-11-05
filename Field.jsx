import { useId } from 'react';
import './Field.css';

/**
 * Campo de formulario con etiqueta y mensaje de error (componente "Campo" en Figma).
 *
 * Uso:
 *   <Field etiqueta="Correo electrónico" type="email" value={correo} onChange={...} error={errores.correo} />
 *
 * Para una lista de opciones (select), pasa `opciones`:
 *   <Field etiqueta="Rol" opciones={[{ valor: 1, texto: 'Ventas' }]} value={rol} onChange={...} />
 *
 * `accion` permite poner un botón dentro del campo, por ejemplo "Mostrar" en la contraseña.
 */
export default function Field({
  etiqueta,
  error,
  accion,
  opciones,
  placeholderOpcion = 'Seleccionar',
  id,
  className = '',
  ...inputProps
}) {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;
  const idError = `${idCampo}-error`;

  const propsComunes = {
    id: idCampo,
    className: `campo__input ${error ? 'campo__input--error' : ''} ${accion ? 'campo__input--con-accion' : ''}`,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? idError : undefined,
    ...inputProps,
  };

  return (
    <div className={`campo ${className}`}>
      <label className="campo__etiqueta" htmlFor={idCampo}>
        {etiqueta}
      </label>

      <div className="campo__caja">
        {opciones ? (
          <select {...propsComunes}>
            <option value="">{placeholderOpcion}</option>
            {opciones.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
          </select>
        ) : (
          <input {...propsComunes} />
        )}
        {accion && <div className="campo__accion">{accion}</div>}
      </div>

      {error && (
        <p className="campo__error" id={idError}>
          {error}
        </p>
      )}
    </div>
  );
}
