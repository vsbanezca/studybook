# StudyBook

Sistema de reserva de espacios y equipamiento de estudio. Proyecto universitario de Ingeniería de Software (UCAB).

## Integrantes

- Vanessa Banezca
- Anabella Freites
- Gabriel Raffoul
- José Quintero

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | v26.13.0 (LTS) |
| npm | 11.4.2 |
| Angular / Angular CLI | 22.2.x (CLI 22.2.6) |
| JDK | Eclipse Temurin 21.0.13 |
| Spring Boot | 4.1.2 |
| Maven | No hace falta instalarlo: se usa el Maven Wrapper (`mvnw`) |

## Cómo correr

### Frontend

```bash
cd frontend
npm install
ng serve
```

Disponible en http://localhost:4200

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

En Windows:

```powershell
cd backend
mvnw.cmd spring-boot:run
```

Para desarrollo local (carga cuentas de prueba) usar el perfil `dev`:

```powershell
mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Cuentas de prueba (solo perfil `dev`, definidas en `application-dev.properties`):

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@studybook.dev | Admin-dev-123 |
| Miembro | miembro@studybook.dev | Miembro-dev-123 |

Fuera de `dev`, la cuenta de Administrador se precarga desde las variables de entorno `STUDYBOOK_ADMIN_CORREO` y `STUDYBOOK_ADMIN_CLAVE` (opcionales: `STUDYBOOK_ADMIN_NOMBRE`, `STUDYBOOK_ADMIN_CEDULA`).

`ng serve` redirige `/api` al backend (`frontend/proxy.conf.json`), por eso no hace falta configurar CORS.

## Decisiones técnicas

- **Sesión:** cookie de sesión de Spring (`JSESSIONID`, HttpOnly, SameSite=Lax) con la sesión guardada en el servidor. Es lo más simple y seguro para Angular + Spring: el navegador la envía solo y JavaScript no puede leerla, así no se guarda ningún token en el cliente. El rol se valida en el servidor (`AutorizacionInterceptor`): `/api/admin/**` responde 403 a un Miembro.
- **Persistencia (provisional):** archivos JSON en `backend/data/` detrás de `JsonRepository`, para reemplazarlos por una base de datos sin tocar servicios ni controladores. La carpeta no se versiona.
- **Contraseñas:** BCrypt (`spring-security-crypto`, licencia Apache 2.0). No se registran ni se devuelven.

Disponible en http://localhost:8080

## Documentos de trabajo

Las especificaciones, guías y prompts del equipo son solo locales (`docs-local/`) y no se suben al repositorio. Están listados en el `.gitignore`.
