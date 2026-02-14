# Documentación de Librerías - Sistema POS

Este archivo registra las librerías de terceros utilizadas en el proyecto y su propósito.

## Backend (NestJS)

| Librería | Propósito |
| :--- | :--- |
| `@prisma/client` | ORM para interactuar con la base de datos PostgreSQL de manera tipada. |
| `prisma` | CLI de Prisma para gestionar migraciones, generar el esquema y realizar seeding. |
| `bcrypt` | Biblioteca para el cifrado y comparación de contraseñas de forma segura utilizando hashing. |
| `@types/bcrypt` | Definiciones de tipos de TypeScript para la librería bcrypt. |
| `ts-node` | Motor de ejecución de TypeScript para Node.js, utilizado principalmente para ejecutar scripts como el seed. |
| `reflect-metadata` | Requerido por NestJS para el soporte de decoradores y metadatos. |
| `rxjs` | Librería para programación reactiva, utilizada internamente por NestJS. |

## Frontend (React + Vite)

| Librería | Propósito |
| :--- | :--- |
| `react-router-dom` | Gestión de rutas y navegación en la aplicación de una sola página (SPA). |
| `lucide-react` | Set de iconos modernos y ligeros para la interfaz. |
| `framer-motion` | Librería para animaciones avanzadas y fluidas en componentes React. |
| `axios` | Cliente HTTP para realizar peticiones a la API del backend. |

---
**Nota:** Todas las dependencias deben ser instaladas dentro de las carpetas respectivas (`back` o `front`) mediante `npm install`.
