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

Disponible en http://localhost:8080
