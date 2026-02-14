# Guía de Gestión de Base de Datos - Sistema POS

Esta guía detalla los pasos necesarios para levantar el entorno de base de datos, ejecutar migraciones y poblar la base de datos con información inicial. El sistema utiliza Docker para la persistencia y Prisma como ORM.

## Requisitos Previos

- Docker Desktop instalado y en ejecución.
- Node.js (versión 18 o superior) y npm instalados.
- Puerto 5432 disponible en el sistema local.

## 1. Levantar el Contenedor de Base de Datos

Inicie el contenedor de PostgreSQL utilizando Docker Compose. Este comando descargará la imagen necesaria y configurará el servicio.

```powershell
docker-compose up -d
```

Para verificar que el contenedor esté corriendo correctamente:

```powershell
docker ps
```

## 2. Configuración de Variables de Entorno

Asegúrese de que el archivo `.env` dentro de la carpeta `back` contenga la cadena de conexión correcta hacia el contenedor de Docker:

```env
DATABASE_URL="postgresql://user_pos:pos_password_2026@localhost:5432/pos_db?schema=public"
```

## 3. Generar el Cliente de Prisma

Ejecute el siguiente comando para generar los tipos de TypeScript basados en el esquema definido.

```powershell
cd back
npx prisma generate
```

## 4. Ejecutar Migraciones

Cree las tablas en la base de datos basándose en el esquema de Prisma. Este comando también aplicará las restricciones e índices definidos.

```powershell
npx prisma migrate dev --name init
```

## 5. Poblar la Base de Datos (Seed)

Ejecute el script de seeding para insertar los datos iniciales (Admin, Vendedor, Categorías, Proveedores y Productos).

```powershell
npx prisma db seed
```

## Consultas y Herramientas Útiles

Para visualizar los datos de forma gráfica a través de una interfaz web, puede utilizar Prisma Studio:

```powershell
npx prisma studio
```

---
**Nota:** El sistema implementa "Soft Delete" a través del campo `activo`. Al eliminar registros desde la lógica de la aplicación, el campo debe marcarse como `false` en lugar de borrar la fila físicamente.
