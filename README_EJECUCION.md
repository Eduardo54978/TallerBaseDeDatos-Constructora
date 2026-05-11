# Sistema Constructora - Guía de ejecución

Este proyecto corresponde al sistema de gestión de una empresa constructora.  
Incluye base de datos en SQL Server, datos precargados, roles, checks, triggers, vistas y una interfaz web básica con Node.js, Express, HTML, CSS y JavaScript.

---

## 1. Requisitos previos

Cada integrante debe tener instalado:

- Git
- Node.js
- SQL Server
- SQL Server Management Studio
- Visual Studio Code

---

## 2. Clonar el repositorio

Abrir PowerShell o la terminal y ejecutar:

```powershell
git clone https://github.com/Eduardo54978/TallerBaseDeDatos-Constructora.git
cd TallerBaseDeDatos-Constructora
```

Luego instalar las dependencias:

```powershell
npm install
```

---

## 3. Archivos principales del proyecto

En la carpeta raíz del proyecto deben estar estos archivos SQL:

```text
42Tablas.sql
DatosPrecargados.sql
ChekinYRoles.sql
CatalogoTriggers.sql
```

También están las carpetas del sistema web:

```text
src/
public/
index.js
package.json
```

---

## 4. Crear la base de datos en SQL Server

Abrir SQL Server Management Studio y ejecutar los archivos SQL en este orden:

```text
1. 42Tablas.sql
2. DatosPrecargados.sql
3. ChekinYRoles.sql
4. CatalogoTriggers.sql
```

### Importante

El orden es obligatorio.

Primero se crean las tablas, luego se insertan los datos, después se agregan checks/roles y finalmente se cargan los triggers y vistas.

---

## 5. Validar que los datos se cargaron correctamente

Después de ejecutar los scripts, correr esta consulta en SQL Server Management Studio:

```sql
USE constructora;
GO

SELECT 
    COUNT(*) AS total_registrohoras,
    SUM(horasTrabajadas) AS total_horas
FROM dbo.registrohoras;
GO
```

El resultado esperado debe ser:

```text
total_registrohoras = 3510
total_horas = 28080.00
```

Si sale ese resultado, los datos principales fueron cargados correctamente.

---

## 6. Verificar que no existan caracteres dañados

Ejecutar esta consulta:

```sql
USE constructora;
GO

DECLARE @sqlBuscarCaracteres NVARCHAR(MAX) = N'';

SELECT @sqlBuscarCaracteres = @sqlBuscarCaracteres + '
SELECT ''' + t.name + ''' AS tabla, ''' + c.name + ''' AS columna, ' + QUOTENAME(c.name) + ' AS texto
FROM ' + QUOTENAME(SCHEMA_NAME(t.schema_id)) + '.' + QUOTENAME(t.name) + '
WHERE ' + QUOTENAME(c.name) + ' LIKE N''%├%''
   OR ' + QUOTENAME(c.name) + ' LIKE N''%┬%''
   OR ' + QUOTENAME(c.name) + ' LIKE N''%Ã%''
   OR ' + QUOTENAME(c.name) + ' LIKE N''%Â%'';' + CHAR(13)
FROM sys.tables t
INNER JOIN sys.columns c
    ON t.object_id = c.object_id
INNER JOIN sys.types ty
    ON c.user_type_id = ty.user_type_id
WHERE ty.name IN ('nvarchar', 'varchar', 'nchar', 'char')
  AND c.is_computed = 0;

EXEC sp_executesql @sqlBuscarCaracteres;
GO
```

Si no devuelve filas, significa que los textos están correctos.

---

## 7. Configurar la conexión a SQL Server

Cada integrante debe configurar su conexión local en:

```text
src/config/db.js
```

Ejemplo de configuración:

```js
const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'TU_PASSWORD',
  server: '127.0.0.1',
  port: 1433,
  database: 'constructora',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log('Conectado OK');
  } catch (err) {
    console.error('Error:', err.message);
  }
};

module.exports = { sql, connectDB };
```

Cada integrante debe cambiar:

```js
password: 'TU_PASSWORD'
```

por la contraseña real de su SQL Server.

Ejemplo:

```js
password: '1704'
```

Si usan otro puerto, también deben modificar:

```js
port: 1433
```

---

## 8. Probar conexión con SQL Server

Antes de ejecutar el sistema, se puede probar desde PowerShell:

```powershell
sqlcmd -S localhost -U sa -P TU_PASSWORD -d constructora -Q "SELECT COUNT(*) FROM registrohoras"
```

Ejemplo:

```powershell
sqlcmd -S localhost -U sa -P 1704 -d constructora -Q "SELECT COUNT(*) FROM registrohoras"
```

Debe devolver:

```text
3510
```

---

## 9. Ejecutar el sistema web

Desde la carpeta del proyecto ejecutar:

```powershell
npm run dev
```

Debe aparecer:

```text
Servidor corriendo en http://localhost:3000
Conectado OK
```

---

## 10. Abrir la interfaz gráfica

Abrir el navegador y entrar a:

```text
http://localhost:3000
```

Ahí se podrá ver la interfaz del sistema constructora.

Secciones disponibles:

```text
Panel Principal
Empleados
Proyectos
Materiales
Contratos
Proveedores
Inventario
```

---

## 11. Rutas API para probar

También se pueden probar las rutas directamente desde el navegador:

```text
http://localhost:3000/api/empleados
http://localhost:3000/api/proyectos
http://localhost:3000/api/materiales
http://localhost:3000/api/contratos
http://localhost:3000/api/proveedores
http://localhost:3000/api/inventario
```

Si esas rutas devuelven datos en formato JSON, la conexión entre el backend y la base de datos está funcionando.

---

## 12. Orden completo de instalación desde cero

Resumen del flujo completo:

```text
1. Clonar el repositorio
2. Ejecutar npm install
3. Abrir SQL Server Management Studio
4. Ejecutar 42Tablas.sql
5. Ejecutar DatosPrecargados.sql
6. Ejecutar ChekinYRoles.sql
7. Ejecutar CatalogoTriggers.sql
8. Configurar src/config/db.js
9. Ejecutar npm run dev
10. Abrir http://localhost:3000
```

---

## 13. Validaciones importantes

### Validar cantidad de registros de horas

```sql
USE constructora;
GO

SELECT 
    COUNT(*) AS total_registrohoras,
    SUM(horasTrabajadas) AS total_horas
FROM dbo.registrohoras;
GO
```

Resultado esperado:

```text
3510    28080.00
```

### Validar cantidad de tablas

```sql
USE constructora;
GO

SELECT COUNT(*) AS total_tablas
FROM sys.tables;
GO
```

Nota: el archivo se llama `42Tablas.sql`, pero el número real de tablas puede variar según la versión del modelo. El nombre del archivo no afecta la ejecución.

---

## 14. Roles del sistema

El sistema maneja roles de base de datos como:

```text
rol_consulta
rol_contador
rol_gerente
rol_jefe_obra
rol_logistica
rol_rrhh
rol_secretaria
```

Para ver los roles:

```sql
USE constructora;
GO

SELECT name AS rol
FROM sys.database_principals
WHERE type = 'R'
  AND name LIKE 'rol_%'
ORDER BY name;
GO
```

Para ver permisos asignados:

```sql
USE constructora;
GO

SELECT 
    r.name AS rol,
    p.state_desc AS estado,
    p.permission_name AS permiso,
    CASE 
        WHEN p.major_id = 0 THEN 'BASE DE DATOS'
        ELSE OBJECT_SCHEMA_NAME(p.major_id) + '.' + OBJECT_NAME(p.major_id)
    END AS objeto
FROM sys.database_permissions p
INNER JOIN sys.database_principals r
    ON p.grantee_principal_id = r.principal_id
WHERE r.name LIKE 'rol_%'
ORDER BY r.name, objeto, p.permission_name;
GO
```

---

## 15. Triggers del sistema

El archivo:

```text
CatalogoTriggers.sql
```

contiene triggers relacionados al control automático del sistema, especialmente inventario y otros procesos importantes.

Para ver los triggers creados:

```sql
USE constructora;
GO

SELECT 
    name AS trigger_name,
    OBJECT_NAME(parent_id) AS tabla
FROM sys.triggers
ORDER BY tabla, trigger_name;
GO
```

---

## 16. Problemas comunes

### Error: Connection lost - socket hang up

Revisar `src/config/db.js`.

Usar esta configuración como base:

```js
server: '127.0.0.1',
port: 1433,
database: 'constructora',
user: 'sa',
password: 'TU_PASSWORD'
```

También confirmar que SQL Server esté funcionando.

---

### Error al cargar empleados

Verificar que la ruta de empleados esté usando el campo correcto:

```sql
salarioReferencial
```

En el backend debe usarse como:

```sql
e.salarioReferencial AS salario
```

---

### La interfaz muestra símbolos raros

Ejecutar la validación de caracteres:

```sql
USE constructora;
GO

DECLARE @sqlBuscarCaracteres NVARCHAR(MAX) = N'';

SELECT @sqlBuscarCaracteres = @sqlBuscarCaracteres + '
SELECT ''' + t.name + ''' AS tabla, ''' + c.name + ''' AS columna, ' + QUOTENAME(c.name) + ' AS texto
FROM ' + QUOTENAME(SCHEMA_NAME(t.schema_id)) + '.' + QUOTENAME(t.name) + '
WHERE ' + QUOTENAME(c.name) + ' LIKE N''%├%''
   OR ' + QUOTENAME(c.name) + ' LIKE N''%┬%''
   OR ' + QUOTENAME(c.name) + ' LIKE N''%Ã%''
   OR ' + QUOTENAME(c.name) + ' LIKE N''%Â%'';' + CHAR(13)
FROM sys.tables t
INNER JOIN sys.columns c
    ON t.object_id = c.object_id
INNER JOIN sys.types ty
    ON c.user_type_id = ty.user_type_id
WHERE ty.name IN ('nvarchar', 'varchar', 'nchar', 'char')
  AND c.is_computed = 0;

EXEC sp_executesql @sqlBuscarCaracteres;
GO
```

Si devuelve filas, revisar que se haya ejecutado completo `DatosPrecargados.sql`.

---

## 17. Importante para GitHub

No se debe subir información local sensible.

Evitar subir cambios en:

```text
src/config/db.js
package-lock.json
node_modules/.package-lock.json
node_modules/
```

Cada integrante debe configurar su propio `db.js` según su SQL Server local.

---

## 18. Comandos útiles de Git

Actualizar el proyecto:

```powershell
git pull origin master
```

Ver cambios pendientes:

```powershell
git status
```

Subir cambios:

```powershell
git add .
git commit -m "mensaje del cambio"
git push origin master
```

Si solo se quiere subir un archivo específico:

```powershell
git add README_EJECUCION.md
git commit -m "Agrega guia de ejecucion"
git push origin master
```

---

## 19. Resultado esperado final

Al finalizar la instalación correctamente:

```text
Base de datos: constructora
Registros en registrohoras: 3510
Total de horas: 28080.00
Servidor: http://localhost:3000
Estado esperado: Conectado OK
Interfaz: visible y funcionando
```

La interfaz debe mostrar correctamente:

```text
Empleados
Proyectos
Materiales
Contratos
Proveedores
Inventario
```

sin caracteres dañados.