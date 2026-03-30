# Scanner Service

Aplicación web para digitalizar facturas mediante OCR. Sube una imagen de tu factura, extrae automáticamente los datos clave y los almacena en una base de datos en la nube.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 |
| Estilos | Tailwind CSS 4 |
| OCR | Google Cloud Vision API |
| Base de datos | Supabase (PostgreSQL) |
| Lenguaje | JavaScript (ES Modules) |

---

## Características

- **Procesamiento de facturas** — sube una imagen JPG, PNG o WEBP y el sistema extrae proveedor, monto y número de factura usando OCR
- **Almacenamiento persistente** — los datos extraídos se guardan automáticamente en Supabase
- **Buscador en tiempo real** — búsqueda por nombre de proveedor con debounce de 400ms directamente sobre la base de datos
- **Eliminación con confirmación** — modal de confirmación antes de borrar cualquier registro
- **Manejo de errores** — mensajes descriptivos en español para cada tipo de fallo (red, permisos, API, duplicados)
- **Estados de carga** — spinner por pasos durante el procesamiento y skeleton animado en el listado
- **Diseño responsivo** — optimizado para móvil y escritorio

---

## Estructura del proyecto

```
scanner-service/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ConfirmModal.jsx     # Modal de confirmación para eliminar
│   │   ├── FacturasList.jsx     # Listado, búsqueda y eliminación de facturas
│   │   └── InvoiceForm.jsx      # Formulario de carga y procesamiento
│   ├── services/
│   │   ├── facturaService.js    # Operaciones CRUD contra Supabase
│   │   └── visionService.js     # OCR con Google Cloud Vision + parsing
│   ├── App.css                  # Estilos globales
│   ├── App.jsx                  # Componente raíz y estado global
│   ├── main.jsx                 # Punto de entrada
│   └── supabaseClient.js        # Inicialización del cliente Supabase
├── .env.example                 # Variables de entorno requeridas
├── .gitignore
├── package.json
└── vite.config.js
```

---

## Requisitos previos

- Node.js 18 o superior
- Cuenta en [Supabase](https://supabase.com) (gratuita)
- API Key de [Google Cloud Vision](https://cloud.google.com/vision) (1,000 solicitudes/mes gratis)

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/scanner-service.git
cd scanner-service

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
VITE_GOOGLE_VISION_API_KEY=tu_api_key_de_google_vision
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

---

## Configuración de Supabase

### 1. Crear la tabla

En tu proyecto de Supabase ve a **SQL Editor** y ejecuta:

```sql
create table facturas (
  id uuid primary key default gen_random_uuid(),
  proveedor text,
  monto text,
  numero_factura text,
  created_at timestamptz default now()
);
```

### 2. Configurar políticas de seguridad (RLS)

```sql
-- Habilitar RLS
alter table facturas enable row level security;

-- Permitir inserción
create policy "Permitir inserción pública"
on facturas for insert to anon
with check (true);

-- Permitir lectura
create policy "Permitir lectura pública"
on facturas for select to anon
using (true);

-- Permitir eliminación
create policy "Permitir eliminación pública"
on facturas for delete to anon
using (true);
```

---

## Iniciar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Flujo de procesamiento

```
Usuario sube imagen
        │
        ▼
  Codificación base64
        │
        ▼
  Google Cloud Vision API
  (DOCUMENT_TEXT_DETECTION)
        │
        ▼
  Parsing con regex
  ┌─────┴──────┐
  Proveedor  Monto  N° Factura
        │
        ▼
  Inserción en Supabase
        │
        ▼
  Visualización en listado
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción en `/dist` |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Ejecuta ESLint sobre el código fuente |

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_GOOGLE_VISION_API_KEY` | API Key de Google Cloud Vision |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase |

> **Nunca subas el archivo `.env` al repositorio.** Está incluido en `.gitignore`.

---

## Notas de seguridad

- Las API keys se exponen en el cliente al usar `VITE_*`. Para producción pública se recomienda mover las llamadas a Google Vision y Supabase a un backend o Edge Function.
- El código de la integración con **Claude API** está comentado en `src/services/visionService.js` como referencia alternativa al OCR.
