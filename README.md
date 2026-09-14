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
4. **Delegación de Identidad al Token**:
   - Al crear una publicación (`POST /api/v1/publicaciones`), el frontend solo envía `titulo` y `contenido`. El backend descarta cualquier `autor_id` del cuerpo e inyecta el ID real desde el JWT decodificado.
5. **Propiedad de Datos (Data Ownership)**:
   - Al actualizar (`PUT`) o eliminar (`DELETE`) una publicación, el backend consulta primero a la base de datos. Si el usuario no es el propietario, la petición se bloquea con **403 Forbidden**.
6. **Paginación (`LIMIT` y `OFFSET`) y Búsqueda Dinámica (`LIKE`)**:
   - Lectura de `page`, `limit` y `search` desde `req.query`, evitando `SELECT *` masivos y aplicando `LIKE '%termino%'` parametrizado con consultas preparadas.
7. **Testing Unitario con Jest (TDD & Mocks)**:
   - 4 suites de pruebas (42 tests) que cubren validaciones RegEx, simulación de middlewares de Express con Mocks (`req`, `res`, `next`), control de propiedad y respuestas HTTP.
8. **Colección de Postman y Documentación**:
   - Colección `postman_collection.json` con flujos completos y escenarios de bloqueo de seguridad.
   - Manual completo en `backend/API_DOCUMENTATION.md`.

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
- Node.js (v18+)
- MySQL Server

### 2. Base de Datos
Ejecutar el script SQL ubicado en `backend/src/database/schema.sql` para crear la base de datos `api3`, las tablas `usuarios` y `publicaciones`, y los datos semilla iniciales.

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
```bash
cd backend
npm install
npm run dev
```

### 5. Ejecutar Pruebas Automatizadas
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
