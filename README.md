<p align="center">
  <img src="front/public/images/image.png" width="200" alt="Logo POS">
</p>

# Sistema POS - MiniProyecto 1

Este es el **MiniProyecto 1** de la materia **Procesos y Diseno de Software**.

## Integrantes
- **Brayan Zuluaga**
- **Esteban Munoz**
- **Isabela Gutierrez**
- **Sebastian Izquierdo**

## Descripcion del Proyecto
El sistema es un punto de venta (POS) en linea que permite la gestion de inventario, ventas, clientes y reportes. Esta primera entrega se enfoca en la infraestructura de base de datos, autenticacion y gestion basica de productos.

## Tecnologias Utilizadas

### Frontend: React + Vite
- **Por que:** Se eligio **React** por su arquitectura basada en componentes, lo que facilita la creacion de interfaces de usuario modulares y reutilizables. **Vite** se utiliza como herramienta de construccion por su velocidad extremadamente rapida en desarrollo y su eficiencia al generar el bundle de produccion, optimizando la experiencia del desarrollador y el rendimiento final.

### Backend: NestJS
- **Por que:** **NestJS** es un framework de Node.js robusto y escalable que utiliza TypeScript por defecto. Se selecciono porque promueve el uso de patrones de diseno solidos (como Inyeccion de Dependencias) y principios SOLID, lo que garantiza un codigo limpio, facil de mantener y probar a medida que el sistema POS crece.

### Base de Datos & ORM: PostgreSQL + Prisma
- **Por que:** **PostgreSQL** es un motor de base de datos relacional altamente confiable para manejar transacciones de ventas. **Prisma** se integra perfectamente con NestJS para ofrecer un acceso a datos con seguridad de tipos (Type-safe), facilitando las migraciones y el modelado de la base de datos.

## Modelo de Base de Datos
A continuación se presenta el diagrama entidad-relación del sistema:

```mermaid
erDiagram
    ROLE ||--o{ USER_ROLE : "asignado en"
    USER ||--o{ USER_ROLE : "tiene"

    USER ||--o{ SALE : "realiza (vendedor)"
    CUSTOMER |o--o{ SALE : "compra"

    CATEGORY ||--o{ PRODUCT : "contiene"
    SUPPLIER |o--o{ PRODUCT : "suministra"

    SALE ||--|{ SALE_ITEM : "contiene"
    PRODUCT ||--o{ SALE_ITEM : "incluido en"

    PRODUCT ||--o{ STOCK_MOVEMENT : "genera"

    SALE ||--o{ SALE_ADJUSTMENT : "tiene"

    ROLE {
        Int id PK
        String nombre UK
    }

    USER {
        Int id PK
        String nombre
        String email UK
        String password_hash
        Boolean activo
        DateTime createdAt
        DateTime updatedAt
    }

    USER_ROLE {
        Int userId PK, FK
        Int roleId PK, FK
    }

    CATEGORY {
        Int id PK
        String nombre
        Boolean activo
    }

    SUPPLIER {
        Int id PK
        String nombre
        String contacto
        String telefono
        String email
        String direccion
        Boolean activo
        DateTime createdAt
        DateTime updatedAt
    }

    PRODUCT {
        Int id PK
        String codigo UK
        String nombre
        Decimal precio
        Int stock
        Boolean activo
        Int categoryId FK
        Int min_stock
        Int supplierId FK
    }

    STOCK_MOVEMENT {
        Int id PK
        Int productId FK
        Int cantidad
        String tipo
        String motivo
        DateTime fecha
    }

    CUSTOMER {
        Int id PK
        String documento UK
        String nombre
        String telefono
        String email
        Boolean activo
        DateTime createdAt
        DateTime updatedAt
    }

    SALE {
        Int id PK
        Int vendedorId FK
        Int clienteId FK
        Decimal total
        DateTime fecha
        String estado
    }

    SALE_ITEM {
        Int id PK
        Int saleId FK
        Int productId FK
        Int cantidad
        Decimal precio_unitario
        Decimal subtotal
    }

    SALE_ADJUSTMENT {
        Int id PK
        Int saleId FK
        String tipo
        String motivo
        DateTime fecha
    }
```

## Documentacion Tecnica
- [Guia de Base de Datos (Docker / Prisma)](GUIABASEDEDATOS.md)
- [Registro de Librerias](LIBRERIAS.md)
- Swagger UI del backend en `http://localhost:3000/docs` (con backend levantado).

## Requisitos
- Docker Desktop
- Node.js & npm

## Pasos para iniciar el proyecto

Siga estos pasos en orden para configurar y ejecutar el sistema localmente:

### 1. Base de Datos
Primero, configure la base de datos siguiendo las instrucciones detalladas en la **[Guia de Base de Datos](GUIABASEDEDATOS.md)**. Esto incluye levantar el contenedor de Docker, correr las migraciones y el seed.

### 2. Instalacion de Dependencias
Instale los paquetes necesarios tanto para el backend como para el frontend:

```powershell
# En la carpeta raiz
cd back
npm install
cd ../front
npm install
```

### 3. Ejecucion de los Servidores
Abra dos terminales independientes y ejecute los siguientes comandos:

**Backend:**
```powershell
cd back
npm run start:dev
```

**Frontend:**
```powershell
cd front
npm run dev
```

### 4. Documentacion de API (Swagger)
Swagger permite documentar y probar los endpoints del backend desde el navegador.

Se usa para:
- Ver rutas disponibles, parametros y bodies.
- Validar respuestas esperadas por endpoint.
- Probar rapidamente la API sin herramientas externas.

Como acceder:
```powershell
cd back
npm run start:dev
```

Abrir en navegador:

`http://localhost:3000/docs`

Autenticacion en Swagger para endpoints protegidos:
1. Ejecuta `POST /auth/login`.
2. Copia `session.token` de la respuesta.
3. Haz clic en `Authorize`.
4. Pega `Bearer <token>`.
5. Ejecuta endpoints de `categories`, `products`, `customers` y `sales`.

---

## Flujo de Trabajo y Recomendaciones

Para mantener el proyecto organizado y evitar conflictos, se recomienda seguir estas pautas:

### 1. Sincronizacion de Ramas
Antes de comenzar a trabajar en cualquier nueva funcionalidad o correccion:
- **Siempre** asegurese de estar en su rama de trabajo.
- Realice un `pull` de la rama `dev` para tener los ultimos cambios integrados:
  ```powershell
  git pull origin dev
  ```

### 2. Gestion de Ramas
- No trabaje directamente sobre `main` o `dev`.

### 3. Commits y Mensajes
- Realice commits frecuentes con mensajes claros (ej. `feat: agregar modelo de cliente`, `fix: corregir error en login`).

### 4. Base de Datos
- Si realiza cambios en el archivo `schema.prisma`, recuerde ejecutar `npx prisma migrate dev` para aplicar los cambios localmente y notificar al equipo, ya que esto generara una nueva carpeta de migracion que debe subirse al repo. *En la medida de lo posible, Brayan sera el encargado de ejecutar cualquier cambio en la base de datos.*
