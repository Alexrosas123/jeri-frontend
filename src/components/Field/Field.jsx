import { useId } from 'react';
import './Field.css';

/**
 * Campo de formulario con etiqueta y mensaje de error (componente "Campo" en Figma).
 *
 * Uso:
 *   <Field etiqueta="Correo electrónico" type="email" value={correo} onChange={...} error={errores.correo} />
 *
 * `accion` permite poner un botón dentro del campo, por ejemplo "Mostrar" en la contraseña.
 */
export default function Field({ etiqueta, error, accion, id, className = '', ...inputProps }) {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;
  const idError = `${idCampo}-error`;

  return (
    <div className={`campo ${className}`}>
      <label className="campo__etiqueta" htmlFor={idCampo}>
        {etiqueta}
      </label>

      <div className="campo__caja">
        <input
          id={idCampo}
          className={`campo__input ${error ? 'campo__input--error' : ''} ${accion ? 'campo__input--con-accion' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? idError : undefined}
          {...inputProps}
        />
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
