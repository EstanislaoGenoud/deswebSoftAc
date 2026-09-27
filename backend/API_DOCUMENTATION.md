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
* Antes de ejecutar `UPDATE` o `DELETE` sobre una publicación o curso, el backend consulta a la base de datos para verificar propiedad (`docente_id === req.usuario.id` o rol administrador).
* Si el usuario no es el propietario del recurso, la petición es rechazada de inmediato con **403 Forbidden** (*Acceso denegado: no tiene permisos para modificar este recurso*).

### 2.6 Creación de Cursos y Capa de Servicios (HU-05 - #87, #88, #89, #90, #92, #93, #95)
* **#87 Datos Requeridos y Restricciones:**

  - `codigo`: Requerido (2-50 caracteres, formato alfanumérico en mayúsculas `^[a-zA-Z0-9_-]{2,50}$`, único en la base de datos).
  - `nombre`: Requerido (3-150 caracteres, texto no vacío).
  - `descripcion`: Opcional (hasta 2000 caracteres).
  - `comision`: Opcional (hasta 50 caracteres, por defecto `'Comisión A'`).
  - `periodo`: Opcional (hasta 50 caracteres, por defecto `'2026 - 1° Cuatrimestre'`).
  - `aula`: Opcional (hasta 50 caracteres, por defecto `'Aula Virtual'`).
  - `horario`: Opcional (hasta 100 caracteres, por defecto `'Lunes y Miércoles 18:30 - 21:30'`).
  - `cupo_maximo`: Opcional (número entero entre 1 y 500, por defecto 35).
  - `activo`: Opcional (booleano / tinyint 0 o 1, por defecto 1).
* **#93 Validación Estricta con RegEx y Sanitización:**
  - El middleware `validateCurso` valida y sanitiza los campos antes de llegar a la lógica de negocio.
  - Bloquea cualquier inyección de `docente_id` en usuarios no administradores.
* **#90 Implementación de Capa de Servicio (`cursoService.js`):**
  - Desacopla la lógica de negocio del controlador HTTP.
  - Verifica unicidad de código (`getCursoByCodigo`) retornando `409 Conflict` si colisiona.
  - Asigna la identidad del docente automáticamente (#92). Si el creador es administrador (`rol_id === 2`) y especifica otro `docente_id`, el servicio valida que dicho docente exista en la base de datos (`usuarioModel.getUsuarioById`).
* **#92 Asociación de Curso con Docente:**
  - Integridad referencial en clave foránea `fk_cursos_docente` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE`).
  - Delegación de identidad al JWT para docentes regulares.

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
| `DELETE` | `/api/v1/usuarios/:id` | Pública | Elimina usuario (bloqueado con 409 si tiene publicaciones o cursos). |

### 4.4 Publicaciones

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/publicaciones` | Pública | Lista publicaciones (`?page=1&limit=10&search=curso`). |
| `GET` | `/api/v1/publicaciones/:id` | Pública | Obtiene publicación por ID con datos del autor. |
| `POST` | `/api/v1/publicaciones` | Bearer JWT | Crea publicación inyectando `autor_id` desde el JWT. |
| `PUT` | `/api/v1/publicaciones/:id` | Bearer JWT | Actualiza publicación propia (403 si es ajena). |
| `DELETE` | `/api/v1/publicaciones/:id` | Bearer JWT | Elimina publicación propia (403 si es ajena). |

### 4.5 Cursos (HU-04, HU-05, HU-06, HU-44 & HU-45 - #78, #79, #80, #83, #84, #87, #88, #89, #90, #92, #93, #95, #96, #97, #99, #101, #104, #105, #106, #108, #109, #111, #112, #113, #114, #115, #117)

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cursos` | Pública | Lista todos los cursos con paginación (`page`, `limit`), búsqueda dinámica (`search`) y filtros (`docente_id`, `escuela_id`, `activo`). |
| `GET` | `/api/v1/cursos/mis-cursos` | Bearer JWT | **HU-04 #79**: Obtiene exclusivamente los cursos asociados al docente autenticado vía JWT (`req.usuario.id`). |
| `GET` | `/api/v1/cursos/docente/:docenteId` | Pública | Obtiene los cursos asociados a un docente específico por ID. |
| `GET` | `/api/v1/cursos/:id` | Pública | Obtiene la ficha básica de un curso por su ID. |
| `GET` | `/api/v1/cursos/:id/detalle` | Opcional JWT | **HU-06 #97**: Obtiene la información detallada completa del curso, incluyendo escuela asociada (#99), cantidad de alumnos (#101), cupos disponibles, porcentaje de ocupación y cálculo de permisos (#104). |
| `GET` | `/api/v1/cursos/:id/escuela` | Pública | **HU-06 #99**: Obtiene los datos institucionales de la escuela asociada (`id`, `codigo`, `nombre`, `director`, `contacto`, `ubicacion`). |
| `GET` | `/api/v1/cursos/:id/alumnos` | Bearer JWT | **HU-06 #101 & #104**: Obtiene la nómina detallada de alumnos inscriptos y estadísticas de cupo. **Regla de seguridad (#104)**: Requiere autenticación y valida que el usuario sea el docente titular o administrador (403 si es un docente no titular). |
| `GET` | `/api/v1/cursos/:id/capacidad` | Pública | **HU-45 #113 & #114**: Consulta y muestra en tiempo real la cantidad de alumnos inscriptos, cupo máximo, cupos disponibles, porcentaje de ocupación y estado de cupo (`disponible`, `completo`, `sin_inscriptos`). |
| `POST` | `/api/v1/cursos/:id/alumnos` | Bearer JWT | **HU-45 #115**: Inscribe a un estudiante en el curso (`{ "alumno_id": 4 }`). **Reglas**: Valida pertenencia de docente/admin (403), existencia de alumno (404), cupos disponibles (409 si el cupo está lleno) y no duplicidad (409). Actualiza y retorna automáticamente la capacidad recalculada en tiempo real. |
| `DELETE`| `/api/v1/cursos/:id/alumnos/:alumnoId`| Bearer JWT | **HU-45 #115**: Desinscribe/elimina a un alumno del curso. Valida permisos y existencia de la inscripción. Actualiza y retorna automáticamente la capacidad recalculada en tiempo real. |
| `PUT` / `PATCH` | `/api/v1/cursos/:id/escuela` | Bearer JWT | **HU-44 #108**: Asocia o reasigna un curso a una escuela académica (`{ "escuela_id": 2 }`). **Reglas (#109)**: Valida pertenencia/existencia de la escuela (404) y permisos de docente titular o admin (403). |
| `POST` | `/api/v1/cursos` | Bearer JWT | **HU-05 #89 & HU-44 #108**: Registra un nuevo curso asignando docente titular (#92) y escuela asociada (#108, #109). |
| `PUT` | `/api/v1/cursos/:id` | Bearer JWT | Modifica un curso. Valida propiedad (`docente_id === req.usuario.id` o admin) y existencia de la escuela si se modifica (#109). |
| `DELETE` | `/api/v1/cursos/:id` | Bearer JWT | Elimina un curso verificando propiedad. |

### 4.6 Escuelas (HU-44 Asociar curso a una escuela - #105, #106, #108, #109, #111)

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/escuelas` | Pública | **HU-44 #106**: Obtiene el catálogo completo de escuelas con estadísticas de total de cursos asignados. |
| `GET` | `/api/v1/escuelas/:id` | Pública | **HU-44 #106**: Obtiene la ficha técnica y de contacto de una escuela por su ID. |
| `GET` | `/api/v1/escuelas/:id/cursos` | Pública | **HU-44 #106**: Obtiene el listado de cursos pertenecientes a la escuela con soporte de paginación y búsqueda dinámica. |

### 4.7 Alumnos (HU-07 Listado, HU-08 Búsqueda, HU-09 Perfil y HU-10 Historial Académico)

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/alumnos` | Bearer JWT | **HU-07 #121, #122**: Listado general de alumnos del sistema con paginación (`page`, `limit`), búsqueda dinámica (`search` por nombre, apellido, email o legajo), y filtros (`curso_id`, `estado`). Incluye enlaces/metadatos de acceso rápido al perfil de cada alumno (`acceso_perfil`, **#127**). |
| `GET` | `/api/v1/alumnos/buscar` | Bearer JWT | **HU-08 #131, #136, #137**: Búsqueda avanzada y filtrado multidimensional de alumnos. Soporta parámetro general unificado (`search` / `q`), búsqueda por campos específicos (`nombre`, `apellido`, `email`, `legajo`), filtros relacionales (`curso_id`, `docente_id`, `escuela_id`, `estado`, `periodo`), filtros de rendimiento (`promedio_min`, `promedio_max`, `desempeno`), ordenamiento dinámico (`sortBy`, `sortOrder`), paginación y manejo de resultados vacíos (**#137**). |
| `GET` | `/api/v1/alumnos/mis-alumnos` | Bearer JWT | **HU-07 #121, #122**: Listado de alumnos asociados a los cursos a cargo del docente autenticado (`req.usuario.id`, **#120**). Soporta paginación, búsqueda por nombre/legajo y filtro por curso específico. Incluye enlaces de acceso directo al perfil académico (**#127**). |
| `GET` | `/api/v1/alumnos/curso/:cursoId` | Bearer JWT | **HU-07 #121, #122**: Listado de alumnos matriculados en un curso específico (**#120**). Verifica permisos del docente o rol administrador. |
| `GET` | `/api/v1/alumnos/mi-perfil` | Bearer JWT | **HU-09 #140**: Obtiene el perfil completo del alumno autenticado vía JWT (`req.usuario.id`). |
| `GET` | `/api/v1/alumnos/mi-historial` | Bearer JWT | **HU-10 #154**: Obtiene el historial académico completo del alumno autenticado vía JWT (`req.usuario.id`), incluyendo cursos anteriores, cursos actuales, calificaciones y métricas de avance. |
| `GET` | `/api/v1/alumnos/:id/historial-academico` | Bearer JWT | **HU-10 #153, #154**: Consulta el historial académico consolidado de un alumno por ID. **Relación alumno → cursos anteriores (#153)**: Agrupa cursos anteriores vs actuales, notas finales, condición de la materia (`Promocionada`, `Aprobada`, `Regularizada`, `En Cursada`, `Libre`), desglose de evaluaciones, agrupación por cuatrimestre/periodo y porcentaje de avance de carrera. **Control de acceso (#150)**: Propio alumno, docente titular o admin. |
| `GET` | `/api/v1/alumnos/:id/perfil` | Bearer JWT | **HU-09 #140**: Obtiene la ficha de perfil consolidada de un alumno por ID (datos personales, legajo, carrera, regularidad, cursos inscriptos y resumen académico). **Control de acceso (#150)**: Permitido al propio alumno, sus docentes asignados o administradores. Bloquea con `403 Forbidden` a terceros. |
| `GET` | `/api/v1/alumnos/:id/calificaciones` | Bearer JWT | **HU-09 #145**: Obtiene el historial de calificaciones registradas por materia, ponderaciones, estado (Aprobado/Desaprobado) y promedio general. |
| `GET` | `/api/v1/alumnos/:id/evaluaciones` | Bearer JWT | **HU-09 #146**: Obtiene las evaluaciones programadas y rendidas en los cursos donde está inscripto, con fechas y estado (Aprobada, Desaprobada, Pendiente). |
| `GET` | `/api/v1/alumnos/:id/resumen-academico` | Bearer JWT | **HU-09 #149**: Diseña y calcula métricas clave de desempeño académico: promedio general (GPA), materias inscriptas, evaluaciones aprobadas/desaprobadas/pendientes, tasa de aprobación (%) y clasificación de desempeño (`Excelente`, `Muy Bueno`, `Regular`, `En Riesgo`). |

---

## 5. Pruebas Unitarias y TDD con Jest

El proyecto cuenta con **175 pruebas unitarias y de integración automatizadas** distribuidas en 14 suites de test:

1. **`tests/regex.test.js`**: Pruebas de Desarrollo Guiado por Pruebas (TDD) para las expresiones regulares de contraseñas complejas, emails, códigos de curso y campos de texto con todos los casos límite.
2. **`tests/authMiddleware.test.js`**: Pruebas con Mocks (`jest.fn()`) sobre `verifyToken` simulando objetos `req`, `res` y `next` de Express (sin levantar el servidor).
3. **`tests/validateMiddleware.test.js`**: Pruebas con Mocks para verificar validación RegEx, rechazos `400 Bad Request`, sanitización de datos y validación de cursos (`validateCurso`), asociaciones (`validateAsociacionEscuela`) e inscripciones (`validateInscripcionAlumno`).
4. **`tests/publicacionOwnership.test.js`**: Pruebas de control de acceso y propiedad de datos, verificando respuestas `403 Forbidden` al intentar modificar o borrar recursos ajenos, y `409 Conflict` al intentar eliminar usuarios con publicaciones o cursos.
5. **`tests/cursoModel.test.js`**: Pruebas unitarias sobre la capa de datos de cursos (consultas SQL, paginación LIMIT/OFFSET, LIKE dinámico, filtro por docente, filtro por escuela y conteo para integridad).
6. **`tests/cursoEndpoints.test.js`**: Pruebas de integración sobre los controladores de cursos (HU-04 #78, #79, #83 Estado Vacío, #84 Probar consulta, control de acceso y permisos).
7. **`tests/cursoCreation.test.js`**: **HU-05 #95 Probar creación**: Pruebas exhaustivas sobre la capa de servicio y controlador para la creación de cursos, validación de datos (#87, #93), conflictos de código (#88), delegación de identidad (#92) y validación de escuelas (#109).
8. **`tests/cursoDetalle.test.js`**: **HU-06 #96 Consultar información del curso**: Pruebas completas sobre endpoint de detalle (#97), datos de escuela asociada (#99), cálculo de cantidad de alumnos y cupos (#101), y validación de permisos (#104).
9. **`tests/escuelaCursoAsociacion.test.js`**: **HU-44 #105 Asociar curso a una escuela**: Pruebas completas sobre catálogo de escuelas (#106), consulta de cursos por escuela (#106), asociación de cursos a escuelas (#108), validación de existencia (#109) y control de permisos con respuestas `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` y `404 Not Found` (#111).
10. **`tests/cursoAlumnosCapacidad.test.js`**: **HU-45 #112 Registrar cantidad de alumnos del curso**: Pruebas de consulta de cantidad (#113), cálculo de ocupación y capacidad (#114), actualización automática de métricas al agregar o eliminar estudiantes (#115), validación de cupo máximo (409 Conflict), prevención de duplicados (409 Conflict), control de permisos docente/admin (403 Forbidden) y pruebas de integración/middleware (#117).
11. **`tests/alumnoPerfil.test.js`**: **HU-09 #139 Consultar perfil del alumno**: Pruebas completas del endpoint de perfil (#140), consulta de calificaciones (#145), evaluaciones (#146), cálculo de resumen académico (#149) y validación estricta de control de acceso (#150) con respuestas `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` y `404 Not Found`.
12. **`tests/alumnoListado.test.js`**: **HU-07 #118 Visualizar listado de alumnos**: Pruebas exhaustivas del listado general (#121, #122), listado de mis alumnos para docentes con asociación relacional (#120), listado por curso, búsqueda dinámica por nombre/legajo, paginación, estado vacío, acceso al perfil en cada registro (#127) y manejo de errores (#129).
13. **`tests/alumnoHistorial.test.js`**: **HU-10 #151 Consultar historial académico**: Pruebas exhaustivas de la relación alumno → cursos anteriores y actuales (#153), endpoint de historial (#154), consulta propia vía JWT (#154), permisos de docente/administrador (#150), filtros por periodo/estado, bloqueo 403 y manejo de errores (#159).
14. **`tests/alumnoBusqueda.test.js`**: **HU-08 #130 Buscar alumno**: Pruebas unitarias y de integración para búsqueda flexible por término unificado (`search`/`q`, **#131**), búsqueda por campos específicos (nombre, apellido, email, legajo), filtros combinados (curso, docente, escuela, estado, periodo, promedios, ordenamiento, **#136**), manejo estructurado de resultados vacíos (**#137**) y controlador `/api/v1/alumnos/buscar` (**#138**).

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
11. **Ejecutar `7.1 Cursos - Listar Todos`**: Comprobar respuesta paginada de `/api/v1/cursos`.
12. **Ejecutar `7.2 Cursos - Mis Cursos (Docente autenticado)`**: Comprobar obtención de cursos asociados vía JWT (`GET /api/v1/cursos/mis-cursos`).
13. **Ejecutar `7.3 Cursos - Crear Curso`**: Comprobar creación con `POST /api/v1/cursos` asignando automáticamente el docente del token.
14. **Ejecutar `8.1 Cursos - Detalle Completo`**: Comprobar `GET /api/v1/cursos/:id/detalle` con escuela y ocupación (#97, #99, #101).
15. **Ejecutar `8.2 Cursos - Escuela Asociada`**: Comprobar `GET /api/v1/cursos/:id/escuela` (#99).
16. **Ejecutar `8.3 Cursos - Nómina de Alumnos (Docente Titular)`**: Comprobar `GET /api/v1/cursos/:id/alumnos` con `200 OK` (#101, #104).
17. **Ejecutar `9.1 Escuelas - Listar Todas`**: Comprobar `GET /api/v1/escuelas` con conteo de cursos (#106).
18. **Ejecutar `9.2 Escuelas - Cursos de Escuela`**: Comprobar `GET /api/v1/escuelas/:id/cursos` (#106).
19. **Ejecutar `9.3 Cursos - Asociar a Escuela`**: Comprobar `PUT /api/v1/cursos/:id/escuela` con `200 OK` (#108).
20. **Ejecutar `9.4 Cursos - Asociar a Escuela Inexistente (Bloqueo 404)`**: Comprobar rechazo 404 por validación de existencia (#109).
21. **Ejecutar `10.1 Cursos - Consultar Capacidad y Cantidad de Alumnos`**: Comprobar `GET /api/v1/cursos/:id/capacidad` (#113, #114).
22. **Ejecutar `10.2 Cursos - Inscribir Alumno (Actualización Automática)`**: Comprobar `POST /api/v1/cursos/:id/alumnos` con incremento automático de cantidad (#115).
23. **Ejecutar `10.3 Cursos - Desinscribir Alumno (Actualización Automática)`**: Comprobar `DELETE /api/v1/cursos/:id/alumnos/:alumnoId` con decremento automático (#115).
24. **Ejecutar `11.1 Alumnos - Listado General (#121, #122, #127)`**: Comprobar `GET /api/v1/alumnos` con paginación y links de perfil.
25. **Ejecutar `11.2 Alumnos - Búsqueda Avanzada y Filtros (HU-08 #131, #136, #137)`**: Comprobar `GET /api/v1/alumnos/buscar?q=Lucas&curso_id=1&desempeno=Excelente`.
26. **Ejecutar `11.3 Alumnos - Mis Alumnos (Docente autenticado #120, #121, #127)`**: Comprobar `GET /api/v1/alumnos/mis-alumnos`.
27. **Ejecutar `11.4 Alumnos - Alumnos de un Curso (#120, #121)`**: Comprobar `GET /api/v1/alumnos/curso/:cursoId`.
28. **Ejecutar `11.5 Alumnos - Historial Académico Completo (HU-10 #153, #154)`**: Comprobar `GET /api/v1/alumnos/4/historial-academico` con cursos anteriores, notas y avance.
29. **Ejecutar `11.6 Alumnos - Mi Historial Académico (HU-10 #154)`**: Comprobar `GET /api/v1/alumnos/mi-historial`.
30. **Ejecutar `11.7 Alumnos - Consultar Perfil Completo (#140, #149)`**: Comprobar `GET /api/v1/alumnos/4/perfil`.
31. **Ejecutar `11.8 Alumnos - Consultar Calificaciones (#145)`**: Comprobar `GET /api/v1/alumnos/4/calificaciones`.
32. **Ejecutar `11.9 Alumnos - Consultar Evaluaciones (#146)`**: Comprobar `GET /api/v1/alumnos/4/evaluaciones`.
33. **Ejecutar `11.10 Alumnos - Consultar Resumen Académico (#149)`**: Comprobar `GET /api/v1/alumnos/4/resumen-academico`.
34. **Ejecutar `11.11 Alumnos - Intento de Acceso por Docente Ajeno (Bloqueo 403 #150)`**: Comprobar bloqueo 403 Forbidden.
35. **Ejecutar `6.1 Intentar Eliminar Usuario con Cursos/Publicaciones`**: Comprobar el bloqueo `409 Conflict` por integridad referencial.






