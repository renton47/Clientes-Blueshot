<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Actúa como un experto en desarrollo web, experto en cms, experto en WordPress y WooCommerce, experto en plugins para WordPress, experto en IA, experto en llm, experto en SEO y posicionamiento web, experto en el plugin "Rank Math SEO" para WordPress y todo eso en nivel senior con más de 20 años de experiencia posicionando webs WordPress en el top ten de Google. Haz una investigación profunda sobre el funcionamiento del plugin "Rank Math SEO", investiga sobre sus posibles conexiones con terceros, su modo de trabajar, etc. Esta investigación, es para conectar un plugin que permite rellenar los campos y optimizar una ficha de producto de forma automática y potenciada mediante IA, para SEO. Lo que quiero lograr con este informe, es poder darselo al llm de Anthropic Claude para que pueda editar el plugin que ya me creó, a fin de que este plugin pueda rellenar los campos SEO que requiere Rank Math SEO para optimizar en SEO las fichas de producto

Rank Math SEO construye el SEO de las fichas de producto WooCommerce combinando los campos estándar del producto (título, descripción, precio, stock, etc.) con metadatos propios (schema JSON‑LD, títulos y descripciones SEO, focus keyword, Open Graph, Twitter, etc.), y además expone hooks y herramientas MCP para que otros plugins y asistentes de IA puedan leer y escribir esos datos.[^1][^2][^3][^4]
Tu plugin de IA puede integrarse de tres formas: rellenando los campos nativos de WooCommerce que Rank Math ya aprovecha, escribiendo directamente en sus metadatos y schema mediante hooks/`postmeta`, o usando MCP desde Claude para leer/actualizar SEO meta de cada producto.[^2][^5][^3][^1]

***

## Objetivo del informe

Tu objetivo es que Claude pueda modificar tu plugin actual para que rellene automáticamente todos los campos SEO que Rank Math necesita en las fichas de producto WooCommerce, de forma consistente con cómo Rank Math trabaja internamente.[^6][^2]

Concretamente, necesitas entender:

- Qué datos usa Rank Math para optimizar productos WooCommerce (schema, metadatos, enlaces, etc.).[^5][^2]
- Qué conexiones externas realiza (APIs Rank Math, Google, IA propia, IndexNow, Facebook…).[^4]
- Qué puntos de integración ofrece (hooks/filters, metakeys en `wp_postmeta`, MCP para IA) para que tu plugin inyecte contenido SEO automáticamente.[^7][^3][^8][^1]

***

## Cómo trabaja Rank Math a nivel general

Rank Math es un plugin SEO modular para WordPress que concentra funciones de múltiples herramientas: análisis SEO, schema, redirecciones, análisis de enlaces, integración con Google Search Console/Analytics y ahora también herramientas IA (Content AI, AI Visibility, AI Link Genius, MCP).[^9][^4]

Algunas características generales relevantes para tu caso:

- Configuración inicial mediante asistente que importa datos desde otros plugins (Yoast, AIOSEO, etc.) y activa solo los módulos necesarios.[^10][^4]
- Sistema de módulos: WooCommerce, Schema, Analytics, Image SEO, Instant Indexing, Content AI, AI Link Genius, AI Visibility, etc., cada uno activable/desactivable.[^10][^4]
- Metabox Rank Math SEO por cada post/producto: ahí se gestionan título SEO, descripción, focus keyword, schema, OG/Twitter, robots, canonical, etc.; estos datos se guardan principalmente en `wp_postmeta` y se usan para generar HTML y JSON‑LD.[^1][^5][^4]

Para desarrollo, Rank Math está construido en PHP (≈52%), JavaScript (≈38%) y SCSS, y tiene repositorio público en GitHub, lo que permite inspeccionar su estructura de metadatos y hooks si necesitas afinar al máximo tu integración.[^9]

***

## Conexiones con terceros y servicios externos

Rank Math se conecta a varios servicios externos; esto es clave si tu plugin también usa IA o APIs externas, para que entiendas el contexto de datos que ya salen del sitio.[^4]

Principales conexiones documentadas:

- **API de sugerencias de keywords** (`api.rankmath.com`): cuando el usuario escribe en el campo Focus Keyword, el texto y el locale del sitio se envían para recibir sugerencias relacionadas.[^4]
- **API Rank Math principal** (`rankmath.com`): se usa para registrar el sitio, verificar licencia y ejecutar el SEO Analysis; se envían URL del sitio, usuario de Rank Math, API key, idioma/keyword objetivo.[^4]
- **OAuth Rank Math** (`oauth.rankmath.com`): puente para conectar Search Console y Analytics vía OAuth; maneja códigos de autorización y tokens de Google.[^4]
- **Content AI** (`cai.rankmath.com`): motor IA propio de Rank Math para keyword research, generación masiva de títulos/descripciones SEO, alt text de imágenes y comprobación de créditos; envía título/contenido, idioma, país y datos de imágenes codificados.[^4]
- **Google APIs** (`googleapis.com`, `google.com`, `googletagmanager.com`, `cdn.ampproject.org`): para Analytics, verificación de tokens y carga del script `gtag.js` o componentes AMP cuando se configura Google Tag/Analytics.[^4]
- **IndexNow API** (`api.indexnow.org`): módulo Instant Indexing que notifica URLs nuevas/actualizadas a buscadores compatibles (Bing, Yandex, etc.), enviando lista de URLs, dominio y API key.[^4]
- **Facebook Graph API** (`graph.facebook.com`): si se configura un App ID, se envía la URL del post y credenciales de app para forzar re-scrape de previews en Facebook.[^4]

Para tu plugin, esto implica que Rank Math ya tiene su propia capa IA (Content AI) y de automatización de indexado; tu solución con Claude debería convivir con estas funciones sin duplicar llamadas innecesarias ni generar conflictos de metadatos.[^4]

***

## Rank Math + IA: Content AI y MCP

Rank Math integra IA de dos formas distintas: su propio motor **Content AI** y la capa **MCP** para conectar asistentes externos como Claude Desktop.[^3][^1][^4]

### Content AI

Content AI es el servicio IA propio de Rank Math, con ~40 herramientas orientadas a SEO:[^4]

- Keyword research, ideas de contenido, optimización on‑page y recomendaciones de densidad.[^4]
- Generación masiva de títulos y meta descripciones SEO a partir del contenido existente.[^4]
- Generación automática de alt text descriptivo para imágenes.[^4]
- RankBot para preguntas rápidas de SEO dentro del panel.[^4]

Estos procesos pasan por `cai.rankmath.com` y se activan solo si el módulo Content AI está habilitado y la cuenta Rank Math está conectada; consumen créditos IA propios de Rank Math.[^4]

### MCP (Model Context Protocol) y asistentes externos

Rank Math MCP es la capa que conecta Rank Math con asistentes IA externos (Claude Desktop, GitHub Copilot, ChatGPT) usando el estándar MCP.[^3]

Funciones clave de MCP:

- El asistente IA puede pedir a Rank Math que ejecute auditorías SEO, recupere metadata, schema y enlaces, y arregle ciertos problemas automáticamente.[^1][^3]
- La comunicación se hace mediante “tools” MCP, por ejemplo:
    - `rank-math/audit-site-seo`: auditoría SEO completa de tu sitio o de un competidor.[^3][^1]
    - `rank-math/fix-site-seo`: corrige tests fallidos (visibilidad del blog, estructura de permalinks, sitemap, schema, robots global, robots.txt, focus keywords faltantes…).[^1]
    - `rank-math/get-post-schema`: devuelve el schema aplicado a un post/producto y los tipos disponibles.[^3][^1]
    - `rank-math/get-post-seo-meta`: devuelve título, descripción, focus keyword, ajustes de robots, canonical, OG/Twitter metadata y SEO score del post.[^1][^3]
    - `rank-math/get-post-links`: lista enlaces internos/externos con URL, anchor y follow/nofollow.[^3][^1]
    - `rank-math/get-link-report`: informe de enlaces (posts sin enlaces, recuentos internos/externos; en PRO, también broken links, redirect chains y status HTTP).[^1]

Además, MCP expone herramientas para **AI Visibility** (monitorizar menciones de tu marca en respuestas de ChatGPT y otros modelos, con métricas de visibilidad, sentimiento, competidores, etc.).[^3][^1][^4]

En tu caso, aunque ahora quieres usar Claude como “desarrollador” de tu plugin, en un siguiente paso podrías hacer que tu plugin interactúe con Rank Math vía MCP (Claude Desktop + adaptador WordPress MCP) para leer metadatos de productos y devolver las nuevas optimizaciones desde IA.[^1][^3]

***

## Integración de Rank Math con WooCommerce

La integración WooCommerce de Rank Math es central para tu caso: Rank Math **automáticamente extrae los datos del producto** desde el editor estándar de WooCommerce y construye el Product Schema, las etiquetas Open Graph y parte del SEO de la ficha.[^2][^6][^5]

### Product Schema para productos WooCommerce

Rank Math define un tipo **WooCommerce Product Schema** que solo está disponible para productos WooCommerce.[^2]

Cuando editas un producto:

- Activas el módulo Schema desde **Rank Math SEO → Dashboard**.[^10][^2]
- En el producto, vas a la pestaña **Schema** → **Schema Generator** y eliges **WooCommerce Product Schema** para usar el schema específico de producto.[^2]

A partir de ahí, Rank Math **tira de los campos estándar del producto**:

- **Nombre**: el título del producto (`post_title`).[^2]
- **SKU**: campo SKU en la pestaña **Inventory** del metabox “Product data”.[^2]
- **URL**: el permalink del producto; puedes editarlo bajo el título.[^2]
- **Descripción**: el campo “Product short description” se usa como descripción en el Product Schema.[^2]
- **Categoría**: categorías de producto en la sidebar; permite elegir un “término primario” si hay varias categorías.[^2]
- **Imágenes**: imagen principal y galería de producto; las imágenes de galería solo se añaden al schema si hay una imagen principal.[^2]
- **Precio (Offers → Price)**: toma el **Regular price** si no hay oferta, o el **Sale price** si hay oferta activa.[^2]
- **Moneda (Price Currency)**: la misma que WooCommerce tiene en **WooCommerce → Settings → General → Currency options**, siempre que haya precio.[^2]
- **Price Valid Until**: si el producto tiene precio en oferta programada, se usa la fecha de fin; si no, Rank Math añade automáticamente último día del año siguiente para evitar warnings en Search Console.[^2]
- **Disponibilidad (Availability)**: se mapea desde Stock Status en Inventory como `InStock`, `OutOfStock` o `BackOrder`.[^2]
- **ItemCondition**: por defecto `NewCondition` para productos físicos.[^2]
- **GTIN / global identifier**: en PRO puedes configurar la clave GTIN (UPC, EAN, ISBN, etc.) en **Rank Math SEO → General Settings → WooCommerce → Global Identifier**; ese campo aparece en Inventory y se usa en schema.[^2]
- **Peso y dimensiones (Weight, Height, Width, Depth + Unitcode)**: se leen de la pestaña **Shipping**, usando las unidades configuradas en **WooCommerce → Settings → Products → General → Measurements**.[^2]
- **AggregateRating y Reviews**: se generan automáticamente a partir de las reseñas de clientes; incluyen rating value, rating count, review count y detalles de cada review (ID, descripción, fecha, rating, autor…).[^2]
- **Brand**: se configura en **Rank Math SEO → General Settings → WooCommerce → Select Brand**, usando una taxonomía de producto; en PRO puedes usar un valor de marca personalizado.[^5][^2]

Para productos variables, Rank Math PRO añade **ProductGroup** en schema para variantes, con propiedades `productGroupID`, `variesBy` y `hasVariant`, accesibles en el schema generado.[^11][^2]

### Open Graph para productos

Rank Math reutiliza los mismos datos de Product Schema para construir metatags Open Graph cuando el producto se comparte en redes sociales:[^2]

- `product:price:amount` → mismo valor que el precio de la oferta en schema.[^2]
- `product:price:currency` → misma moneda que WooCommerce.[^2]
- `product:availability` → stock status (In stock, Out of stock, On backorder).[^2]
- `product:retailer_item_id` (PRO) → normalmente el SKU cuando se gestiona stock.[^2]
- `product:brand` → valor de marca configurado en Rank Math WooCommerce.[^2]

Esto significa que, si tu plugin optimiza correctamente estos campos nativos de WooCommerce y la marca/GTIN en Rank Math, no necesitas construir tu propio JSON‑LD: Rank Math ya lo hará de forma consistente para SEO y para redes sociales.[^6][^5][^2]

***

## Metadatos SEO por ficha de producto

Además del schema de producto, Rank Math mantiene un conjunto de **metadatos SEO propios por cada post/producto** que son accesibles vía MCP (`get-post-seo-meta`) y se usan en el front y en los sitemaps.[^3][^1]

Ese conjunto incluye, para cada producto:

- **Título SEO** (puede diferir de `post_title` si lo personalizas).[^1][^3]
- **Descripción SEO** (meta description).[^3][^1]
- **Focus keyword principal y adicionales**.[^1][^3][^4]
- **Ajustes de robots** (index/noindex, follow/nofollow).[^3][^1]
- **Canonical URL**.[^1][^3]
- **Open Graph metadata** (título OG, descripción OG, imagen OG).[^3][^1]
- **Twitter Card metadata**.[^1][^3]
- **SEO score interno** basado en tests de contenido y configuración.[^5][^3][^1]

Rank Math permite definir **plantillas de títulos y meta** por tipo de contenido en **Rank Math → Titles \& Meta**, p.ej. `%product_title% – %sitename%` para productos; estos patrones se aplican automáticamente si no se han personalizado campos SEO por ficha.[^6][^10][^4]

Para tu plugin, esto abre dos caminos:

1. Dejar que Rank Math genere título/description basados en plantillas y tu contenido optimizado (título, short description, etc.).[^10][^6][^2]
2. Escribir directamente en los metadatos SEO propios de Rank Math (vía `postmeta` y/o hooks), sobrescribiendo las plantillas.[^7][^5][^1]

***

## Hooks y filtros de Rank Math útiles para tu plugin

Rank Math expone una serie de **hooks y filtros** para que temas y plugins interactúen con los datos que genera.[^7][^5]

Ejemplos relevantes:

- Filtros para modificar el **schema de producto antes de imprimirlo**; en la documentación y en ejemplos de terceros se usa, por ejemplo, un filtro sobre la entidad de Product Schema para añadir o cambiar la marca.[^5][^7]
- Filtros para modificar **datos de snippet** (rich snippet entity) en función de condiciones especiales: ideal para que tu plugin ajuste ciertas propiedades (marca, atributos personalizados, etc.) sin tocar directamente el JSON‑LD.[^7][^5]
- En PRO, filtros específicos para extender ProductGroup y otros tipos de schema avanzados.[^11]

También se ha documentado que herramientas como SleekView leen y escriben en metakeys como `rank_math_product_brand`, `rank_math_gtin`, `rank_math_mpn` y agregados de reseñas, demostrando que Rank Math almacena parte de su información de Product Schema en `wp_postmeta` con prefijos `rank_math_*`.[^8]

Tu plugin puede aprovechar estos puntos de extensión:

- Usar hooks Rank Math para ajustar la estructura del schema generado (por ejemplo, añadir propiedades personalizadas basadas en datos IA).[^5][^7]
- Escribir en las metakeys de Rank Math (p.ej., las usadas para brand/GTIN/MPN) en lugar de crear tu propia lógica de JSON‑LD.[^8]

Para los campos específicos de título SEO, meta description y focus keyword, la ruta más segura es inspeccionar el código y la base de datos de Rank Math en tu instalación de desarrollo (GitHub y `wp_postmeta`) para identificar las metakeys exactas y asegurarte de que tu plugin las actualiza con el formato esperado.[^9][^4]

***

## Opciones de integración para tu plugin de IA

Con toda esta información, puedes orientar a Claude para modificar tu plugin de IA de acuerdo con tres niveles de integración complementarios:

### 1. Rellenar campos nativos de WooCommerce (mínimo riesgo)

En este enfoque, tu plugin se limita a optimizar los campos que Rank Math ya usa para Product Schema y OG:[^6][^5][^2]

- `post_title` → nombre de producto optimizado con la keyword principal.
- `post_name` (slug/permalink) → URL corta, descriptiva y con la keyword.[^6][^2]
- `post_excerpt` (Product short description) → resumen persuasivo optimizado para SEO, que Rank Math usa como descripción en Product Schema y puede actuar como base de meta description.[^2]
- Categorías de producto y término primario → estructura clara y semántica.[^6][^2]
- Imagen destacada y galería → imágenes relevantes, con alt text generado por tu IA (o por Content AI, si activas ese módulo).[^4][^2]
- Regular price / Sale price + fechas → ofertas bien definidas con `price` y `priceValidUntil` correctos.[^2]
- Stock status → valores coherentes para Availability.[^5][^2]
- SKU y GTIN/ISBN/UPC/EAN → identificadores limpios y consistentes.[^5][^2]
- Peso y dimensiones → datos correctos para productos físicos.[^2]
- Brand (taxonomía o valor personalizado) → asignación uniforme por categoría o proveedor.[^5][^2]

Ventajas:

- No dependes de metakeys internas de Rank Math.[^6][^2]
- Rank Math sigue controlando schema, OG, sitemaps y análisis sin perder compatibilidad.[^4][^2]
- Tu plugin se centra en generar y escribir contenido de calidad en campos estándar.


### 2. Escribir directamente en metadatos SEO de Rank Math

Si quieres que tu plugin de IA tenga control total sobre título SEO, meta description, focus keyword y OG/Twitter, entonces Claude debe:[^5][^3][^1]

1. Identificar las metakeys que Rank Math utiliza para:
    - Título SEO.
    - Meta description.
    - Focus keyword(s).
    - Robots/canonical.
    - OG \& Twitter título/description/imagen.

Esto se hace inspeccionando el código en GitHub y el `wp_postmeta` del entorno de desarrollo.[^9][^4]
2. Implementar lógica para generar estos valores a partir de:
    - Datos del producto (nombre, categoría, atributos, precio, etc.).[^5][^2]
    - Query objetivo de SEO (keyword principal que tú definas para la ficha).
    - Directrices de estilo (longitud de meta, uso de power words, evitar relleno de palabras clave, etc.).[^5]
3. Escribir los valores generados usando `update_post_meta()` en las metakeys apropiadas, disparando si es necesario hooks de Rank Math o de WordPress para recalcular el SEO score o refrescar sitemaps.[^7][^4]

Este enfoque da lugar a fichas donde Rank Math se convierte en motor de renderizado y análisis, pero tu plugin controla el contenido SEO textual.

### 3. Integración con MCP y Claude Desktop (capa avanzada)

En un estadio más avanzado, puedes hacer que tu flujo de trabajo con Claude y Rank Math sea bidireccional, usando MCP:[^3][^1]

- Claude Desktop, conectado al adaptador MCP de WordPress y a Rank Math MCP, puede ejecutar:
    - `rank-math/get-post-seo-meta` para leer el estado actual de SEO de una ficha de producto.[^1][^3]
    - `rank-math/get-post-schema` para ver el schema aplicado y proponer cambios.[^1]
    - `rank-math/get-post-links` y `get-link-report` para analizar enlaces internos/externos del producto.[^3][^1]
- Tu plugin (o un script auxiliar) puede:
    - Llamar a Claude vía MCP con un prompt que incluya los datos del producto y la respuesta de `get-post-seo-meta`.[^3][^1]
    - Recibir propuestas de título SEO, meta description y mejoras de contenido.
    - Escribir esas propuestas en los metadatos de Rank Math como en el enfoque 2.

Esto te da un stack donde WooCommerce ↔ Rank Math ↔ Claude están alineados en tiempo real, y tu plugin actúa como orquestador.

***

## Recomendaciones prácticas para Claude al editar tu plugin

Para que este informe sea útil como “brief” técnico para el LLM de Anthropic, te propongo estas instrucciones claras para Claude:

1. **Mapea los campos de producto necesarios:**
    - Lee la documentación de Rank Math WooCommerce Product Schema para listar todos los campos que Rank Math consume desde WooCommerce.[^2]
    - En el código de tu plugin, asegúrate de tener acceso a `WC_Product` y a todos sus campos (precio, stock, atributos, etc.).[^6][^2]
2. **Decide el nivel de integración (1, 2 o 3) y documenta esa decisión en el código:**
    - Si optas por rellenar solo campos nativos, céntrate en optimizar `post_title`, `post_name`, `post_excerpt`, categorías, imágenes, precio, SKU, GTIN, brand, peso y dimensiones.[^6][^5][^2]
    - Si vas a escribir metadatos Rank Math, añade una capa de abstracción (`RankMathSeoMetaRepository`) que encapsule las llamadas a `update_post_meta()` y los nombres de metakeys, para mantener el código desacoplado.[^9][^1]
3. **Usa hooks de WordPress WooCommerce para disparar tu lógica IA:**
    - Por ejemplo, al guardar un producto (`save_post_product` o hooks específicos de WooCommerce), recoge la información del producto y llama a tu backend IA (Claude) para generar los textos SEO.[^6][^2]
    - Asegúrate de respetar timeouts y de poder desactivar la generación IA por rol o por producto (no todo needs IA).
4. **Integra gradualmente con hooks Rank Math:**
    - Añade filtros sobre las entidades de schema para introducir datos adicionales cuando estén disponibles (colores, materiales, atributos clave), usando los hooks documentados por Rank Math.[^7][^5]
    - Valida siempre el JSON‑LD resultante con la Rich Results Testing Tool de Google.[^6][^2]
5. **Ten en cuenta las conexiones externas existentes:**
    - Si activas Content AI de Rank Math, evita que tu plugin también genere automáticamente metadescripciones para las mismas fichas, o al menos define reglas de precedencia (p.ej. “si hay meta generada por Content AI, no sobrescribir”).[^4]
    - No dupliques llamadas a IndexNow; deja que Rank Math gestione la notificación de nuevas/actualizadas URLs.[^4]

Con este enfoque, Claude tendrá una guía clara de qué hace Rank Math, qué datos necesita y dónde tu plugin puede intervenir para rellenar de forma automática todos los campos SEO críticos de las fichas de producto, sin romper la lógica interna del plugin ni sus integraciones externas.
<span style="display:none">[^12][^13][^14][^15]</span>

<div align="center">⁂</div>

[^1]: https://rankmath.com/kb/mcp-tools/

[^2]: https://rankmath.com/kb/woocommerce-product-schema/

[^3]: https://rankmath.com/blog/rank-math-mcp/

[^4]: https://wordpress.org/plugins/seo-by-rank-math/

[^5]: https://www.rianstech.com/optimize-woocommerce-store-using-rank-math/

[^6]: https://webcoreshop.com/seo/woocommerce-seo/rank-math-woocommerce-setup-step-by-step-guide/

[^7]: https://rankmath.com/docs/filters-and-hooks/

[^8]: https://sleekwp.com/view/for/rank-math-woocommerce-seo/

[^9]: https://github.com/rankmath/seo-by-rank-math

[^10]: https://onlinemediamasters.com/rank-math-settings/

[^11]: https://support.rankmath.com/ticket/productgroup-for-rankmath/

[^12]: https://rankmath.com/kb/

[^13]: https://github.com/rankmath/seo-by-rank-math/blob/master/rank-math.php

[^14]: https://github.com/rankmath/seo-by-rank-math/blob/master/readme.txt

[^15]: https://rankmath.com/kb/how-to-customize-schema-markup-for-woocommerce-products/

