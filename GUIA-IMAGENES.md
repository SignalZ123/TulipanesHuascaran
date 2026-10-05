# Guía de compresión y publicación de imágenes · Tulipanes Huascarán

Las imágenes de la carpeta `img/` son **ilustraciones de ejemplo**. Reemplázalas por las fotos reales del negocio manteniendo los mismos nombres y medidas, o actualiza las rutas en `index.html`.

## 1. Medidas que usa la página

| Uso | Proporción | Original (máster) | Anchos a exportar |
|---|---|---|---|
| Hero (carrusel principal) | 16:10 | 1600 × 1000 | 480, 960, 1600 |
| Catálogo (tarjetas) | 4:5 | 800 × 1000 | 400, 600, 800 |
| Galería | 4:3 | 1200 × 900 | 480, 800, 1200 |
| Open Graph (redes) | 1,91:1 | 1200 × 630 | solo JPG |

Respeta la proporción: el HTML declara `width`, `height` y `aspect-ratio`, así que una foto con otra proporción se recortará (`object-fit: cover`). Recorta la foto antes de exportarla y deja el motivo principal (el ramo) en el centro.

## 2. Formatos y calidad recomendada

Cada imagen se publica en tres formatos; el navegador elige el mejor que soporte:

| Formato | Calidad sugerida | Peso objetivo |
|---|---|---|
| AVIF | 45–55 | Hero ≤ 120 KB · producto ≤ 50 KB · galería ≤ 70 KB |
| WebP | 70–78 | un 25–35 % más pesado que el AVIF |
| JPG (respaldo) | 75–80, progresivo | el más pesado; solo lo usan navegadores antiguos |

La imagen del hero principal (`hero-1`) es la de **mayor prioridad**: es la que define el LCP. Mantenla por debajo de ~120 KB en AVIF a 960 px.

## 3. Herramientas

**Sin instalar nada (la opción más simple)**
- [Squoosh](https://squoosh.app): arrastra la foto, elige AVIF/WebP/JPG, ajusta calidad y ancho, y descarga.

**En lote (recomendado si tienes muchas fotos)** — con [ImageMagick](https://imagemagick.org) 7:

```bash
# Ejemplo para una foto de producto "ramo-rosa.jpg" (4:5)
for w in 400 600 800; do
  magick ramo-rosa.jpg -resize ${w}x -strip -quality 52 prod-rosa-$w.avif
  magick ramo-rosa.jpg -resize ${w}x -strip -quality 74 prod-rosa-$w.webp
  magick ramo-rosa.jpg -resize ${w}x -strip -quality 78 -interlace Plane prod-rosa-$w.jpg
done
```

Con [`sharp`](https://sharp.pixelplumbing.com) (Node.js):

```js
import sharp from 'sharp';
for (const w of [400, 600, 800]) {
  const img = sharp('ramo-rosa.jpg').resize({ width: w });
  await img.clone().avif({ quality: 52 }).toFile(`prod-rosa-${w}.avif`);
  await img.clone().webp({ quality: 74 }).toFile(`prod-rosa-${w}.webp`);
  await img.clone().jpeg({ quality: 78, progressive: true }).toFile(`prod-rosa-${w}.jpg`);
}
```

## 4. Buenas prácticas antes de subir

1. **Exporta desde el original**, no desde una imagen ya comprimida (evita pérdida acumulada).
2. **Elimina metadatos** (EXIF, GPS, perfiles): `-strip` en ImageMagick; en Squoosh se quitan solos.
3. **No subas fotos de 4000 px del celular.** Nunca se muestran a más de 1600 px.
4. **Nombres claros y en minúsculas**, sin tildes ni espacios: `prod-rosa-600.webp`.
5. **Texto alternativo real.** Al cambiar una foto, actualiza su `alt` en `index.html` describiendo lo que se ve (colores, tipo de arreglo, contexto). No escribas “imagen de…”.
6. **Perfil de color sRGB.** Evita Display P3 o Adobe RGB para web.
7. **Fotos con mucho detalle o ruido** (fondos con textura) pesan más: usa fondos lisos o desenfocados.

## 5. Después de subir al hosting

- Activa **compresión Brotli o Gzip** para HTML, CSS y JS.
- Sirve las imágenes con **caché larga**: `Cache-Control: public, max-age=31536000, immutable` (si cambias una foto, cambia también su nombre, por ejemplo `prod-rosa-v2-600.webp`).
- Verifica que el servidor entregue los tipos MIME correctos: `image/avif`, `image/webp`.
- Si usas una CDN (Cloudflare, Netlify, Vercel), activa HTTP/2 o HTTP/3.

Ejemplo para Apache (`.htaccess`):

```apache
<IfModule mod_mime.c>
  AddType image/avif .avif
  AddType image/webp .webp
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/avif "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType text/css   "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## 6. Cómo comprobar el resultado

1. **PageSpeed Insights** (pagespeed.web.dev) o **Lighthouse** en Chrome (DevTools → Lighthouse), en modo móvil.
2. Metas a vigilar: **LCP < 2,5 s** (objetivo del proyecto: < 1,5 s), **CLS < 0,1**, **INP < 200 ms**.
3. En DevTools → Network, filtra por *Img* y revisa que:
   - `hero-1` se pida primero y con prioridad alta,
   - las imágenes de catálogo y galería **no** se descarguen hasta acercarte con el scroll,
   - se descargue AVIF (o WebP) y no JPG.
4. Revisa accesibilidad con la pestaña *Accessibility* de Lighthouse y prueba la página solo con teclado (Tab, Shift + Tab, Enter, flechas).
