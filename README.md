# 🔷 Portal de Clientes Blueshot

**Portal privado de clientes con inteligencia artificial especializada en e-commerce, SEO y marketing digital.**

---

## ¿Qué hace este proyecto?

Este es el portal privado de clientes de Blueshot. Tiene dos partes principales:

1. **Área de Recursos** — Descarga materiales exclusivos (ZIPs, guías, documentos) de forma segura.
2. **Blueshot AI** — Asistente de inteligencia artificial que te ayuda a crear fichas de producto, contenido SEO, copy para redes sociales y más.

---

## Requisitos para instalarlo

Antes de comenzar, necesitas tener instalado en tu computador:

- **Node.js** (v18 o superior) → [Descargar en nodejs.org](https://nodejs.org)
- **Git** → [Descargar en git-scm.com](https://git-scm.com)
- Una cuenta en **Supabase** → [app.supabase.com](https://app.supabase.com) ✅ (ya tienes una)
- Una API Key de **OpenAI** → [platform.openai.com](https://platform.openai.com) ✅ (ya tienes una)

---

## Instalación paso a paso

### PASO 1 — Descargar el proyecto

Abre Terminal y ejecuta:

```bash
git clone https://github.com/tuusuario/blueshot-client-portal.git
cd blueshot-client-portal
```

### PASO 2 — Instalar dependencias

```bash
npm install
```

> Esto puede tardar 1-2 minutos. Es normal.

---

## Configuración

### PASO 3 — Crear el archivo de configuración

Copia el archivo de ejemplo:

```bash
cp .env.example .env.local
```

Luego abre el archivo `.env.local` con cualquier editor de texto y completa los valores.

---

## Cómo obtener las credenciales de Supabase

### PASO 4 — Obtener las API Keys de Supabase

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Haz clic en tu proyecto
3. En el menú izquierdo, ve a **Settings** → **API**
4. Copia los siguientes valores y pégalos en tu `.env.local`:

| Variable | Qué copiar |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | El valor de **Project URL** (ej: `https://abc.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | El valor de **anon** (clave pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | El valor de **service_role** (clave secreta) |

> ⚠️ **Importante**: La `service_role` key es secreta. Nunca la compartas ni la subas a internet.

### PASO 5 — Obtener el ID del proyecto y contraseña de la base de datos

1. En Supabase, ve a **Settings** → **General**
2. Copia el **Reference ID** (parece: `abcdefghijkl`) → es tu `SUPABASE_PROJECT_ID`

3. Ve a **Settings** → **Database**
4. En la sección **Connection string**, encontrarás la contraseña → es tu `SUPABASE_DB_PASSWORD`

---

## Configurar OpenAI

### PASO 6 — Obtener tu API Key de OpenAI

1. Ve a [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Haz clic en **Create new secret key**
3. Dale un nombre (ej: "Blueshot Portal") y copia la clave
4. Pégala en `.env.local` como `OPENAI_API_KEY=sk-...`

---

## Generar claves de seguridad

### PASO 7 — Generar secretos de seguridad

Ejecuta estos dos comandos por separado y copia cada resultado:

```bash
openssl rand -base64 32
```

El primer resultado es para `JWT_SECRET`, el segundo para `WP_INTEGRATION_SECRET`.

Tu `.env.local` debe quedar así (con tus valores reales):

```
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_DB_PASSWORD=tu-password-de-base-de-datos
SUPABASE_PROJECT_ID=tuproyectoid
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
JWT_SECRET=resultado-del-primer-openssl
WP_INTEGRATION_SECRET=resultado-del-segundo-openssl
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WP_URL=https://blueshot.cl
NODE_ENV=development
```

---

## Configurar la base de datos

### PASO 8 — Conectar con Supabase y aplicar migraciones

Primero, vincula tu proyecto local con Supabase:

```bash
npx supabase login
```

Esto abrirá el navegador para que inicies sesión.

Luego vincula con tu proyecto:

```bash
npx supabase link --project-ref TU_PROJECT_ID
```

> Reemplaza `TU_PROJECT_ID` con el Reference ID que copiaste en el PASO 5.

Finalmente, aplica las migraciones (crea todas las tablas):

```bash
npm run db:push
```

> Esto creará automáticamente todas las tablas, índices, funciones y políticas de seguridad en tu base de datos.

### PASO 9 — Crear el bucket de Storage para archivos

1. Ve a tu proyecto en Supabase
2. En el menú izquierdo, ve a **Storage**
3. Haz clic en **New bucket**
4. Nómbralo: `client-resources`
5. Asegúrate de que **Public bucket** esté **DESACTIVADO** (privado)
6. Haz clic en **Save**

---

## Ejecutar el proyecto

### PASO 10 — Iniciar el servidor local

```bash
npm run dev
```

Abre tu navegador y ve a: **http://localhost:3000**

Deberías ver la página de inicio de sesión del portal.

---

## Cómo iniciar sesión

El portal usa **enlaces mágicos** por email (sin contraseña):

1. Ve a `http://localhost:3000`
2. Escribe tu correo electrónico
3. Haz clic en **"Enviar enlace de acceso"**
4. Revisa tu correo y haz clic en el enlace recibido
5. ¡Listo! Estarás dentro del portal.

> **Primera vez**: Debes crear el registro del cliente manualmente en la tabla `clients` de Supabase, vinculando tu email con el usuario auth.

---

## Configurar el plugin de WordPress

### PASO 11 — Instalar el plugin

El plugin está en la carpeta `wordpress-plugin/blueshot-portal/`.

1. Comprime la carpeta `blueshot-portal/` en un ZIP
2. En tu WordPress, ve a **Plugins → Añadir nuevo → Subir plugin**
3. Sube el ZIP y activa el plugin

### PASO 12 — Configurar el plugin

1. Ve a **Ajustes → Blueshot Portal** en tu panel de WordPress
2. Completa:
   - **URL del Portal**: `https://clientes.blueshot.cl` (o tu dominio)
   - **Secreto de Integración**: el mismo valor de `WP_INTEGRATION_SECRET` de tu `.env.local`
3. Guarda los cambios

### PASO 13 — Usar el shortcode

En cualquier página o widget de WordPress, agrega:

```
[blueshot_portal_button]
```

Los usuarios que estén logueados en WordPress podrán acceder directamente al portal sin una segunda contraseña.

---

## Despliegue en producción

### Opción recomendada: Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. Conecta tu repositorio de GitHub
3. En Vercel, ve a tu proyecto → **Settings → Environment Variables**
4. Agrega todas las variables del `.env.local` (las mismas, con los valores de producción)
5. Cambia `NEXT_PUBLIC_APP_URL` a tu dominio real (ej: `https://clientes.blueshot.cl`)
6. Haz deploy

> **Dominio personalizado**: En Vercel → Settings → Domains, agrega `clientes.blueshot.cl`

---

## Cómo actualizar el proyecto

Cuando haya actualizaciones:

```bash
git pull
npm install
npm run db:push
```

---

## Comandos útiles

| Comando | ¿Para qué sirve? |
|---------|-----------------|
| `npm run dev` | Iniciar servidor local de desarrollo |
| `npm run build` | Compilar para producción |
| `npm test` | Ejecutar tests de seguridad |
| `npm run type-check` | Verificar tipos de TypeScript |
| `npm run db:push` | Aplicar migraciones a la base de datos |
| `npm run db:diff` | Ver cambios pendientes en la base de datos |

---

## Solución de problemas comunes

### El portal no carga / Error 500
- Verifica que todas las variables en `.env.local` estén completas
- Verifica que hayas ejecutado `npm run db:push`

### No recibo el email de inicio de sesión
- Ve a Supabase → **Authentication** → **Email Templates**
- Verifica que el email de confirmación esté configurado
- Revisa la carpeta de spam

### Error "Supabase credentials are not configured"
- Verifica que `.env.local` existe (no `.env.example`)
- Verifica que las variables de Supabase no tengan espacios extra

### La IA no responde / Error de OpenAI
- Verifica que `OPENAI_API_KEY` sea correcta
- Verifica que tengas crédito disponible en tu cuenta de OpenAI

### Las migraciones fallan
- Verifica que `SUPABASE_PROJECT_ID` sea correcto
- Verifica que `SUPABASE_DB_PASSWORD` sea correcto
- Ejecuta `npx supabase login` nuevamente

---

## Estructura del proyecto (para referencia)

```
blueshot-client-portal/
├── app/                    # Páginas de la aplicación
│   ├── (auth)/login/       # Página de inicio de sesión
│   ├── (portal)/           # Área del portal (protegida)
│   │   ├── dashboard/      # Panel principal
│   │   └── recursos/       # Descarga de archivos ZIP
│   ├── (ai)/chat/          # Blueshot AI (chat)
│   └── api/                # APIs del servidor
│       ├── auth/           # Autenticación
│       ├── ai/chat/        # Endpoint de IA (streaming)
│       ├── resources/      # Descarga segura de archivos
│       └── wp-auth/        # Integración WordPress
├── components/             # Componentes reutilizables
│   ├── ai/                 # Interfaz del chat de IA
│   └── portal/             # Sidebar, recursos, etc.
├── lib/                    # Lógica de negocio
│   ├── supabase/           # Clientes de base de datos
│   ├── auth/               # Autenticación y sesiones
│   ├── ai/prompts/         # Prompts de las herramientas IA
│   └── security/           # URLs firmadas para archivos
├── supabase/migrations/    # Estructura de la base de datos
├── types/                  # Tipos TypeScript
├── wordpress-plugin/       # Plugin para WordPress
└── docs/                   # Documentación adicional
```

---

## Seguridad

Este portal implementa las siguientes medidas de seguridad:

- ✅ **Row Level Security (RLS)**: Cada cliente solo puede ver sus propios datos
- ✅ **Magic Links**: Sin contraseñas que memorizar o que puedan ser robadas
- ✅ **URLs firmadas**: Los archivos ZIP nunca tienen una URL pública permanente
- ✅ **Tokens JWT de corta duración**: La integración WordPress usa tokens de 5 minutos
- ✅ **API Keys solo en el servidor**: OpenAI y Supabase service_role nunca llegan al navegador
- ✅ **Validación de entradas**: Todos los datos que entran son validados con Zod
- ✅ **Headers de seguridad HTTP**: X-Frame-Options, X-Content-Type-Options, etc.

---

## Soporte

¿Necesitas ayuda? Contacta al equipo de desarrollo de Blueshot.

**Blueshot** · [blueshot.cl](https://blueshot.cl)
