import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Field from '../../components/Field/Field';
import Logo from '../../components/Logo/Logo';
import { iniciarSesion, obtenerSesion } from '../../services/auth';
import './Login.css';

// Revisa que el correo tenga forma "algo@algo.algo"
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(correo, contrasena) {
  const errores = {};
  if (!correo.trim()) errores.correo = 'Escribe tu correo.';
  else if (!FORMATO_CORREO.test(correo.trim())) errores.correo = 'El correo no tiene un formato válido.';

  if (!contrasena) errores.contrasena = 'Escribe tu contraseña.';
  else if (contrasena.length < 6) errores.contrasena = 'Debe tener al menos 6 caracteres.';
  return errores;
}

/** Pantalla de inicio de sesión · RF-01 · CU-01 · Jira SCRUM-5 */
export default function Login() {
  const navegar = useNavigate();

  // "Estado" de la pantalla: lo que el usuario escribe y lo que mostramos
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Si ya hay sesión, no tiene caso mostrar el login
  if (obtenerSesion()) return <Navigate to="/dashboard" replace />;

  async function alEnviar(evento) {
    evento.preventDefault(); // evita que la página se recargue

    const nuevosErrores = validar(correo, contrasena);
    setErrores(nuevosErrores);
    setErrorGeneral('');
    if (Object.keys(nuevosErrores).length > 0) return;

    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), contrasena);
      navegar('/dashboard');
    } catch (error) {
      setErrorGeneral(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <section className="login__marca">
        <div className="login__logo">
          <Logo tamano={44} />
          <span>Medidental JERI</span>
        </div>

        <div className="login__mensaje">
          <h1>Sistema Integral de Gestión</h1>
          <p>Clientes, proveedores, productos, inventario, compras, ventas y cotizaciones en una sola plataforma.</p>
        </div>

        <p className="login__empresa">Comercializadora MEDIDENTAL JERI S.A. de C.V.</p>
      </section>

      <section className="login__panel">
        <form className="login__formulario" onSubmit={alEnviar} noValidate>
          <div className="login__titulo">
            <h2>Iniciar sesión</h2>
            <p>Ingresa con tu correo y contraseña.</p>
          </div>

          <Field
            etiqueta="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={correo}
            onChange={(e) => {
              setCorreo(e.target.value);
              setErrores((prev) => ({ ...prev, correo: undefined }));
            }}
            error={errores.correo}
          />

          <Field
            etiqueta="Contraseña"
            type={mostrarContrasena ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Escribe tu contraseña"
            value={contrasena}
            onChange={(e) => {
              setContrasena(e.target.value);
              setErrores((prev) => ({ ...prev, contrasena: undefined }));
            }}
            error={errores.contrasena}
            accion={
              <button
                type="button"
                className="login__mostrar"
                onClick={() => setMostrarContrasena((valor) => !valor)}
                aria-pressed={mostrarContrasena}
              >
                {mostrarContrasena ? 'Ocultar' : 'Mostrar'}
              </button>
            }
          />

          <div className="login__opciones">
            <label className="login__recordarme">
              <input type="checkbox" /> Recordarme
            </label>
            <a href="#recuperar">¿Olvidaste tu contraseña?</a>
          </div>

          {errorGeneral && (
            <p className="login__error" role="alert">
              {errorGeneral}
            </p>
          )}

          <Button type="submit" anchoCompleto disabled={enviando}>
            {enviando ? 'Entrando…' : 'Iniciar sesión'}
          </Button>

          <p className="login__nota">El acceso y los permisos dependen del rol asignado a cada usuario.</p>
        </form>
      </section>
    </div>
  );
}
