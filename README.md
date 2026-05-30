# crypto-donations-frontend

Frontend en React + Vite + TypeScript para el sitio de donaciones Bitcoin.

## Requisitos

- Node.js 18+
- Backend corriendo en `localhost:3000` (o configurar `VITE_API_URL`)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
# Abre en http://localhost:5173
```

## Build

```bash
npm run build
```

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL del backend | `http://localhost:3000` |

Crear un archivo `.env` en la raíz con:

```
VITE_API_URL=https://tu-backend.up.railway.app
```
