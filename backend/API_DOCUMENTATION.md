# Documentación de la API: Sistema de Gestión Académico

Este documento detalla la arquitectura, el diseño de seguridad, los modelos de datos, los endpoints de la API REST y las suites de pruebas unitarias implementadas para cumplir con los requerimientos académicos y profesionales de desarrollo web seguro.

---

## 1. Arquitectura y Patrón de Diseño (MVC)

El backend está desarrollado sobre **Node.js** y **Express** bajo el patrón de arquitectura **Modelo-Vista-Controlador (MVC)**, utilizando módulos nativos de ECMAScript (`ES Modules` / `import`):

```
backend/
├── src/
│   ├── config/
│   │   └── connection.js           # Pool de conexiones MySQL con mysql2/promise
│   ├── utils/
│   │   └── validators.js           # Lógica pura de validaciones y Expresiones Regulares (RegEx)
│   ├── middlewares/
│   │   ├── authToken.middleware.js # Middleware de verificación JWT e inyección de req.usuario
│   │   └── validate.middleware.js  # Middlewares de validación de payloads y sanitización
│   ├── models/
│   │   ├── usuarioModel.js         # Capa de datos para usuarios (SQL parametrizado, paginación)
│   │   └── publicacionModel.js     # Capa de datos para publicaciones (LIMIT/OFFSET, LIKE, FK)
│   ├── controllers/
│   │   ├── authController.js       # Autenticación y firma de tokens JWT
│   │   ├── usuarioController.js    # Perfil seguro (GET /perfil), CRUD y protección de integridad
│   │   └── publicacionController.js# Inyección de identidad JWT, control de propiedad (403), filtros
│   ├── routes/
│   │   ├── usuarioRoutes.js        # Rutas de usuarios y autenticación
│   │   └── publicacionRoutes.js    # Rutas para publicaciones
│   └── database/
│       └── schema.sql              # Script DDL de base de datos con claves foráneas e índices
├── tests/
│   ├── regex.test.js               # Tests unitarios TDD para Expresiones Regulares
│   ├── authMiddleware.test.js      # Tests unitarios con Mocks para verifyToken
│   ├── validateMiddleware.test.js  # Tests unitarios con Mocks para validación de entrada
│   └── publicacionOwnership.test.js# Tests unitarios con Mocks para propiedad de datos (403)
├── postman_collection.json         # Colección exportable de Postman con casos de uso y bloqueos
├── server.js                       # Configuración y arranque del servidor Express
└── package.json                    # Dependencias y scripts de testing con Jest en ESM
```

---

## 2. Requerimientos de Seguridad Implementados

### 2.1 Identidad y Endpoint de Perfil Seguro (`GET /perfil` y `GET /api/v1/usuarios/perfil`)
* **Problema en sistemas inseguros:** El uso de URLs parametrizadas como `GET /usuarios/5` permite a atacantes cambiar el ID numérico (`GET /usuarios/6`) para acceder a datos privados de otros usuarios (vulnerabilidad *Broken Object Level Authorization* / *IDOR*).
* **Solución implementada:** Se implementó un endpoint estático `GET /perfil`. El controlador ignora cualquier parámetro de URL del usuario y extrae de forma estricta la identidad desde el token JWT decodificado en `req.usuario.id`.

### 2.2 Expresiones Regulares (RegEx) en el Backend
* **Principio:** *"Nunca confiar en la validación del Frontend"*. El backend aplica sus propios filtros antes de realizar el hash de contraseñas (`bcrypt.hash`) o procesar correos.
* **RegEx de Contraseña:**
  ```javascript
  export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/;
  ```
  Exige:
  - Mínimo 8 caracteres.
  - Al menos una letra minúscula (`[a-z]`).
  - Al menos una letra mayúscula (`[A-Z]`).
  - Al menos un dígito numérico (`\d`).
  - Al menos un carácter especial (`[!@#$%^&*...]`).
* **RegEx de Email:**
  ```javascript
  export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  ```

### 2.3 Recurso "Publicaciones" e Integridad Referencial
* Se creó la tabla `publicaciones` con una clave foránea `autor_id` que referencia a `usuarios(id)`:
  ```sql
  CONSTRAINT `fk_publicaciones_autor`
    FOREIGN KEY (`autor_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
  ```
* **Protección contra eliminación:** Se configuró `ON DELETE RESTRICT` y una validación en el controlador `deleteUsuarioController` que consulta `countPublicacionesByAutor(id)`. Si el usuario tiene publicaciones activas, la petición se rechaza con **409 Conflict**, previniendo eliminaciones accidentales o inconsistencias en la base de datos.

### 2.4 Delegación de Identidad al Token JWT
* Al crear una publicación (`POST /api/v1/publicaciones`), el frontend únicamente envía `{ "titulo": "...", "contenido": "..." }`.
* El middleware `validatePublicacion` descarta activamente cualquier `autor_id` inyectado en el cuerpo (`req.body`).
* El controlador inyecta el ID real del creador extrayéndolo directamente desde `req.usuario.id`.

### 2.5 Propiedad de Datos (Data Ownership)
* Estar logueado no otorga permisos para modificar los recursos de otros usuarios.
* Antes de ejecutar `UPDATE` o `DELETE` sobre una publicación, el backend consulta a la base de datos (`getPublicacionById(id)`).
* Si `publicacion.autor_id !== req.usuario.id`, la petición es rechazada de inmediato con **403 Forbidden** (*Acceso denegado: no es el propietario del recurso*).

---

## 3. Optimización de Consultas SQL

### 3.1 Paginación (`LIMIT` y `OFFSET`)
Se evitan los `SELECT *` masivos leyendo `page` y `limit` desde `req.query`:
* Cálculo matemático: `offset = (page - 1) * limit`.
* Consulta parametrizada:
  ```sql
  SELECT p.*, u.nombre AS autor_nombre, u.apellido AS autor_apellido, u.email AS autor_email
  FROM publicaciones p
  JOIN usuarios u ON p.autor_id = u.id
  ORDER BY p.fecha_creacion DESC
  LIMIT 10 OFFSET 0;
  ```
* Retorna metadatos de paginación (`total`, `page`, `limit`, `totalPages`).

### 3.2 Búsqueda Dinámica (`LIKE`)
Si el cliente envía el parámetro `?search=termino`, el backend intercepta el término y construye dinámicamente la cláusula:
```sql
WHERE (p.titulo LIKE ? OR p.contenido LIKE ?)
```
Pasando `[%termino%, %termino%]` a través de *Prepared Statements* de MySQL2 para garantizar total inmunidad frente a inyecciones SQL.

---

## 4. Catálogo de Endpoints

### 4.1 Autenticación

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/usuarios/login` | Pública | Recibe `{ email, password }` y retorna token JWT firmado. |

### 4.2 Perfil Seguro

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/perfil` | Bearer JWT | Obtiene los datos del usuario autenticado vía `req.usuario.id`. |
| `GET` | `/api/v1/usuarios/perfil` | Bearer JWT | Alias en la ruta de usuarios. |

### 4.3 Usuarios

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/usuarios` | Pública | Lista usuarios paginados (`?page=1&limit=10&search=...`). |
| `GET` | `/api/v1/usuarios/:id` | Pública | Obtiene usuario por su ID. |
| `POST` | `/api/v1/usuarios` | Pública | Registra un usuario aplicando validación RegEx. |
| `PUT` | `/api/v1/usuarios/:id` | Pública | Actualiza nombre y apellido. |
| `PUT` | `/api/v1/usuarios/:id/password`| Pública | Actualiza contraseña aplicando validación RegEx. |
| `DELETE` | `/api/v1/usuarios/:id` | Pública | Elimina usuario (bloqueado con 409 si tiene publicaciones). |

### 4.4 Publicaciones

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/publicaciones` | Pública | Lista publicaciones (`?page=1&limit=10&search=curso`). |
| `GET` | `/api/v1/publicaciones/:id` | Pública | Obtiene publicación por ID con datos del autor. |
| `POST` | `/api/v1/publicaciones` | Bearer JWT | Crea publicación inyectando `autor_id` desde el JWT. |
| `PUT` | `/api/v1/publicaciones/:id` | Bearer JWT | Actualiza publicación propia (403 si es ajena). |
| `DELETE` | `/api/v1/publicaciones/:id` | Bearer JWT | Elimina publicación propia (403 si es ajena). |

---

## 5. Pruebas Unitarias y TDD con Jest

El proyecto cuenta con **42 pruebas unitarias automatizadas** distribuidas en 4 suites de test:

1. **`tests/regex.test.js`**: Pruebas de Desarrollo Guiado por Pruebas (TDD) para las expresiones regulares de contraseñas complejas, emails y campos de texto con todos los casos límite.
2. **`tests/authMiddleware.test.js`**: Pruebas con Mocks (`jest.fn()`) sobre `verifyToken` simulando objetos `req`, `res` y `next` de Express (sin levantar el servidor).
3. **`tests/validateMiddleware.test.js`**: Pruebas con Mocks para verificar el rechazo con status `400 Bad Request` y la eliminación de `autor_id` en el body.
4. **`tests/publicacionOwnership.test.js`**: Pruebas de control de acceso y propiedad de datos, verificando respuestas `403 Forbidden` al intentar modificar o borrar recursos ajenos, y `409 Conflict` al intentar eliminar usuarios con publicaciones.

### Ejecución de Pruebas

Para ejecutar las pruebas:
```bash
npm test
```

Para ejecutar las pruebas con reporte de cobertura:
```bash
npm run test:coverage
```

---

## 6. Pruebas en Postman

Se incluye el archivo `backend/postman_collection.json` listo para importar en Postman.

### Flujo de Pruebas Recomendado:
1. **Ejecutar `1.1 Registro - Contraseña Débil`**: Comprobar el bloqueo `400 Bad Request` por RegEx.
2. **Ejecutar `1.2 Registro - Contraseña Robusta`**: Comprobar el código de éxito `201 Created`.
3. **Ejecutar `1.3 Login`**: El script de prueba en Postman guardará automáticamente la variable `{{token}}`.
4. **Ejecutar `2.1 GET /perfil`**: Comprobar que responde con los datos del usuario del token sin parámetros en la URL.
5. **Ejecutar `2.2 GET /perfil - Sin Token`**: Comprobar el bloqueo `401 Unauthorized`.
6. **Ejecutar `3.1 Crear Publicación`**: Comprobar que el `autor_id` se asigna automáticamente desde el token.
7. **Ejecutar `4.1 Modificar Publicación Propia`**: Comprobar código `200 OK`.
8. **Ejecutar `4.2 Modificar Publicación Ajena`**: Comprobar el bloqueo `403 Forbidden`.
9. **Ejecutar `5.1 Listar Publicaciones Paginadas`**: Comprobar la estructura con `LIMIT` y `OFFSET`.
10. **Ejecutar `5.2 Búsqueda Dinámica con LIKE`**: Comprobar el filtrado por término de búsqueda.
11. **Ejecutar `6.1 Intentar Eliminar Usuario con Publicaciones`**: Comprobar el bloqueo `409 Conflict` por integridad referencial.
