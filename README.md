# Sistema de Gestión Académico - API REST

Sistema backend desarrollado con **Node.js**, **Express** y **MySQL** bajo el patrón **MVC**, enfocado en seguridad estricta, arquitectura limpia, control de acceso basado en propiedad, paginación, búsqueda dinámica y desarrollo guiado por pruebas (TDD).

---

## 📌 Principales Requerimientos Implementados

1. **Endpoint Estático de Perfil (`GET /perfil`)**:
   - Previene ataques de sustitución de parámetros (IDOR / BOLA) confiando exclusivamente en el `id` extraído del token JWT (`req.usuario.id`).
2. **Validación Backend con Expresiones Regulares (RegEx)**:
   - Valida complejidad de contraseñas (mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial) y formato de correo electrónico antes de interactuar con la base de datos o ejecutar el hash con bcrypt.
3. **Módulo de Publicaciones con Integridad Referencial**:
   - Tabla `publicaciones` vinculada mediante clave foránea `autor_id` con restricción `ON DELETE RESTRICT` y verificación de integridad para evitar eliminar usuarios con publicaciones activas.
4. **Módulo de Cursos y Visualización Docente (HU-04 - #78, #79, #80, #83, #84)**:
   - **#78**: Endpoint de cursos (`/api/v1/cursos`) con paginación, filtros y búsqueda dinámica `LIKE`.
   - **#79**: Consulta segura de cursos asociados al docente autenticado (`GET /api/v1/cursos/mis-cursos`) mediante token JWT.
   - **#80**: Interfaz web interactiva en `frontend/` para visualizar asignaturas, comisiones, horarios, aulas y cupos.
   - **#83**: Componente de Estado Vacío ilustrado con acciones contextuales para docentes sin cursos asignados o búsquedas sin coincidencias.
   - **#84**: Suite exhaustiva de pruebas unitarias y de integración para la capa de modelos y controladores de cursos.
5. **Delegación de Identidad al Token**:
   - Al crear recursos (`POST /api/v1/publicaciones`, `POST /api/v1/cursos`), el backend descarta cualquier ID de autor o docente del cuerpo e inyecta el ID real desde el JWT decodificado.
6. **Propiedad de Datos (Data Ownership)**:
   - Al actualizar (`PUT`) o eliminar (`DELETE`), el backend consulta primero a la base de datos. Si el usuario no es el propietario, la petición se bloquea con **403 Forbidden**.
7. **Paginación (`LIMIT` y `OFFSET`) y Búsqueda Dinámica (`LIKE`)**:
   - Lectura de `page`, `limit` y `search` desde `req.query`, evitando `SELECT *` masivos y aplicando `LIKE '%termino%'` parametrizado con consultas preparadas.
8. **Testing Unitario con Jest (TDD & Mocks)**:
   - 6 suites de pruebas (71 tests automatizados) que cubren validaciones RegEx, middlewares de Express, control de propiedad, consultas SQL de cursos y endpoints HTTP.
9. **Colección de Postman y Documentación**:
   - Colección `postman_collection.json` con flujos completos y escenarios de bloqueo de seguridad.
   - Manual completo en `backend/API_DOCUMENTATION.md`.

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
- Node.js (v18+)
- MySQL Server

### 2. Base de Datos
Ejecutar el script SQL ubicado en `backend/src/database/schema.sql` para crear la base de datos `api3`, las tablas `usuarios`, `publicaciones` y `cursos`, junto con los datos semilla iniciales.

### 3. Configuración de Variables de Entorno
Verificar el archivo `backend/.env`:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=api3
JWT_SECRET=jwt_secret_key
```

### 4. Instalación y Ejecución

#### Opción A: Con Docker (Recomendado)
```bash
docker compose up --build
```
Esto iniciará automáticamente:
- **MySQL 8.0** en el puerto `3306` (con el esquema inicial cargado)
- **phpMyAdmin** en `http://localhost:8080`
- **Backend API** en `http://localhost:3000`

#### Opción B: Ejecución Local
```bash
cd backend
npm install
npm run dev
```

### 5. Visualizar Frontend
Abrir el archivo `frontend/index.html` en un navegador web o ejecutar un servidor estático local para interactuar con el módulo de visualización de cursos (HU-04).

### 6. Ejecutar Pruebas Automatizadas
```bash
cd backend
npm test
```
Para ver reporte de cobertura:
```bash
npm run test:coverage
```

---

## 📂 Enlaces a Documentación y Recursos

- 📄 [Documentación Detallada de la API](file:///c:/Users/estan/OneDrive/Escritorio/DesarrolloDeSoftware/3er/Desarrollo_De_Sistemas_Web/Sist_Gestion_Academico/backend/API_DOCUMENTATION.md)
- 🧪 [Colección de Postman](file:///c:/Users/estan/OneDrive/Escritorio/DesarrolloDeSoftware/3er/Desarrollo_De_Sistemas_Web/Sist_Gestion_Academico/backend/postman_collection.json)
- 🗄️ [Script SQL de Base de Datos](file:///c:/Users/estan/OneDrive/Escritorio/DesarrolloDeSoftware/3er/Desarrollo_De_Sistemas_Web/Sist_Gestion_Academico/backend/src/database/schema.sql)
- 💻 [Frontend - Visualización de Cursos](file:///c:/Users/estan/OneDrive/Escritorio/DesarrolloDeSoftware/3er/Desarrollo_De_Sistemas_Web/Sist_Gestion_Academico/frontend/index.html)

