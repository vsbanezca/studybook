# StudyBook

Sistema de reserva de espacios de estudio y de consulta de su equipamiento. Proyecto universitario de Ingeniería de Software (UCAB).

## Integrantes

- Vanessa Banezca
- Anabella Freites
- Gabriel Raffoul
- José Quintero

## Historias del Sprint 1

| Historia | Quién la usa |
|---|---|
| Registrarse | Visitante (crea una cuenta de Miembro) |
| Iniciar sesión | Miembro y Administrador |
| Crear espacio | Administrador |
| Consultar espacios | Miembro y Administrador |
| Crear equipamiento | Administrador |
| Consultar equipamiento de un espacio | Miembro y Administrador |
| Crear reserva | Miembro |
| Consultar mis reservas | Miembro |

Las ocho están implementadas en el frontend y en el backend, con pruebas.

## Estructura

El sistema tiene dos contenedores:

| Carpeta | Contenedor | Tecnología |
|---|---|---|
| `frontend/` | Aplicación web (cliente) | Angular 22 (componentes standalone) |
| `backend/` | API REST | Spring Boot 4.1.2, Java 21 |

- **Frontend** (`frontend/src/app/`): una carpeta por historia (`cuenta/`, `espacios/`, `equipamiento/`, `reservas/`), `core/` (sesión, guardas de ruta, interceptor y `ApiService`) y `compartido/` (componentes visuales `ui/`, validación `validacion/` y textos).
- **Backend** (`backend/src/main/java/ve/edu/ucab/studybook/`): `control/` con una carpeta por historia (controlador, servicio, repositorio y DTO), más `comun/` y `seguridad/`; `model/` con los conceptos del dominio y `exceptions/` con el manejo de errores.
- **Persistencia:** archivos JSON en `backend/data/` (`cuentas.json`, `espacios.json`, `equipamientos.json`, `reservas.json`), detrás de `JsonRepository`. La carpeta se crea al arrancar y no se versiona (está en `.gitignore`).

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 26.13.0 |
| npm | 11.4.2 |
| Angular CLI | 22.2.6 (se instala con `npm install`) |
| Java (JDK) | 21 (Eclipse Temurin 21.0.13) |
| Maven | Se usa el Maven Wrapper del repositorio (`mvnw`); si no puede descargar Maven, sirve un Maven instalado (`mvn`) |

## Cómo ejecutar

### Backend (puerto 8080)

```bash
cd backend
./mvnw spring-boot:run
```

En Windows: `mvnw.cmd spring-boot:run`. Si el wrapper falla al descargar Maven, usa `mvn spring-boot:run`.

El perfil normal de la aplicación es `dev` (`spring.profiles.active=dev` en `application.properties`), así que no hace falta indicarlo.

### Frontend (puerto 4200)

En otra terminal:

```bash
cd frontend
npm install
npm start
```

Abre http://localhost:4200. `ng serve` redirige todo lo que empieza con `/api` al backend en `http://localhost:8080` (`frontend/proxy.conf.json`), por eso no hace falta configurar CORS y la cookie de sesión viaja con cada petición.

### Pruebas

```bash
cd frontend
npm run verificar   # estilo, ng build y ng test

cd backend
./mvnw test         # o mvn test
```

El flujo `.github/workflows/ci.yml` repite ambas verificaciones en cada pull request.

## Datos iniciales

Al arrancar solo se precargan las **dos cuentas base**:

| Cuenta | Clase que la crea | Dónde se configuran el correo y la clave |
|---|---|---|
| Administrador | `CargaAdministrador` | Propiedades `studybook.admin.correo` y `studybook.admin.clave`. En el perfil `dev` vienen de `application-dev.properties`; en otro perfil, de las variables de entorno `STUDYBOOK_ADMIN_CORREO` y `STUDYBOOK_ADMIN_CLAVE` (opcionales: `STUDYBOOK_ADMIN_NOMBRE`, `STUDYBOOK_ADMIN_CEDULA`) |
| Miembro | `CargaMiembroPrueba` | Propiedades `studybook.miembro-prueba.correo` y `studybook.miembro-prueba.clave`, en `application-dev.properties` (solo perfil `dev`) |

Cada cuenta se crea una sola vez: si ya existe, no se duplica. Las claves se guardan cifradas con BCrypt.

No se precargan espacios, equipamientos ni reservas: el Administrador crea los espacios y su equipamiento desde la aplicación, y los Miembros crean sus reservas. También se pueden crear cuentas de Miembro nuevas con «Registrarse» (correo `@ucab.edu.ve` o `@est.ucab.edu.ve`, según `studybook.registro.dominios`).

## Decisiones técnicas

- **El front valida, el back verifica.** El frontend valida el formato de los datos antes de enviarlos (campos obligatorios, tipos, correo institucional, teléfono, fechas y horas no pasadas, hora de fin posterior a la de inicio) con los validadores de `frontend/src/app/compartido/validacion/`. El backend nunca confía en el frontend: vuelve a comprobar el formato con Bean Validation (responde 400 con el campo y un código) y aplica las reglas de negocio (choque de horario, capacidad, existencia del espacio, datos repetidos y permisos por rol). La capacidad del espacio también se revisa en el frontend, pero solo como aviso temprano: quien decide es el backend.
- **El back manda códigos, el front redacta.** Ante un error, `GlobalExceptionHandler` responde el estado HTTP y un cuerpo `{ "mensaje": <código general>, "campos": { <campo>: <código> } }` con códigos de `CodigosValidacion` (por ejemplo `datos_invalidos`, `equipamiento_repetido`, `no_disponible`). El servidor no escribe textos para el usuario: `frontend/src/app/compartido/validacion/validation-messages.ts` traduce cada código y todos los textos están en `frontend/src/app/compartido/messages.ts`. Un código desconocido se muestra como «Datos proporcionados incorrectos».
- **Un solo canal de comunicación.** `ApiService` (`frontend/src/app/core/api.service.ts`) es la única clase del frontend que usa `HttpClient`. Toma la URL base de `environments` (`/api`), envía la cookie de sesión y la usan `CuentaService`, `EspacioService`, `EquipamientoService` y `ReservaService`. El interceptor `authInterceptor` solo atiende la respuesta 401 (vuelve a Iniciar sesión).
- **Sesión:** cookie de sesión de Spring (`JSESSIONID`, HttpOnly, SameSite=Lax) con la sesión guardada en el servidor. JavaScript no puede leerla y no se guarda ningún token en el cliente. El rol se valida en el servidor con `AutorizacionInterceptor`.
- **Fecha y hora:** las reglas que dependen de «hoy» y de «ahora» usan un `Clock` con la zona `studybook.zona-horaria` (America/Caracas por defecto). Las pruebas usan un reloj fijo, así que no dependen de la zona horaria de la máquina.
- **Persistencia (provisional):** archivos JSON detrás de `JsonRepository`, para poder reemplazarlos por una base de datos sin tocar servicios ni controladores.
- **Contraseñas:** BCrypt (`spring-security-crypto`). No se registran en el log ni se devuelven por la API.

## Documentos de trabajo

Las especificaciones, guías y documentos de trabajo del equipo son solo locales (`docs-local/`) y no se suben al repositorio. Están listados en el `.gitignore`.
