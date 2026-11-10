# Tarjeta de fidelidad Hanaki

- **Registro (clientes):** `https://hanakisushi.com/fidelidad/`
- **Tarjeta del cliente:** `https://hanakisushi.com/fidelidad/tarjeta.html?t=…` (se guarda en la pantalla de inicio del móvil)
- **Panel del personal:** `https://hanakisushi.com/admin/` — pantalla «Bienvenida admin» con la contraseña (la sesión dura 30 días en cada dispositivo). Dentro, pestañas *Reservas* y *Fidelización*.

Hay **tres tipos de sello**, cada uno con su propio contador: buffet de mediodía, buffet de noche y menú. 8 sellos de un tipo = 1 premio de ese tipo (buffet de mediodía gratis, buffet de noche gratis o menú gratis). Para cambiar los 8 sellos: `SELLOS_PREMIO` en `functions/api/fidelidad/_lib.js` y `objetivo` en `fidelidad/config.js`. Los tipos y los textos de los premios están en `TIPOS` (mismo archivo `_lib.js`).

## Puesta en marcha (una sola vez, en Cloudflare)

1. **Crear la base de datos:** Cloudflare → Storage & Databases → D1 → *Create* → nombre `hanaki-fidelidad`.
2. **Crear las tablas:** abre la base de datos → pestaña *Console* → pega el contenido de `fidelidad/schema.sql` → *Execute*.
3. **Conectarla a la web:** Workers & Pages → proyecto de hanakisushi.com → Settings → Bindings → *Add* → D1 database → nombre de variable `DB` → base de datos `hanaki-fidelidad`.
4. **Contraseña del panel:** Settings → Variables and Secrets → *Add* → tipo *Secret*, nombre `ADMIN_PASSWORD`, valor: la contraseña que usará el personal.
5. **Volver a desplegar:** Deployments → último despliegue → *Retry deployment* (los cambios de bindings solo se aplican en un despliegue nuevo).

6. **Emails para «Ver mi tarjeta»** (código de 6 cifras al email del cliente), con Resend (gratis hasta 3.000 emails/mes):
   - Crea cuenta en resend.com → *Domains* → *Add domain* → `hanakisushi.com` → añade en Cloudflare DNS los registros que te indique y espera a que salga *Verified*.
   - *API Keys* → *Create* (permiso *Sending access*) → copia la clave.
   - En Pages: Variables and Secrets → *Secret* `RESEND_API_KEY` = la clave. Opcional: `EMAIL_FROM` = `Hanaki Sushi <tarjeta@hanakisushi.com>`.
   - Vuelve a desplegar. La tabla `accesos` se crea sola.

Todo entra en los planes gratuitos de Cloudflare y Resend.

## Uso en el local

- El cliente enseña el QR de su tarjeta → en el panel, *Escanear tarjeta* → elegir qué ha tomado (mediodía, noche o menú) y se pone el sello. En la lista de clientes hay un botón por tipo con el mismo efecto.
- Si el QR no funciona: buscar por nombre, teléfono o el código de 6 letras que aparece bajo el QR.
- Si se intenta sellar dos veces en menos de 60 min, el panel pide confirmación.
- Cuando un tipo llega a 8 sellos, su botón pasa a *Canjear*; al canjear, ese contador vuelve a 0 (los otros no cambian).
- Para quitar un sello por error: *Ficha* → *Corregir sellos* → −1 en el tipo que corresponda.
- *Enlace* reenvía su tarjeta a un cliente que la ha perdido.
- *CSV* descarga la lista de socios (para Excel).

## Privacidad

Se guardan nombre, teléfono, email (opcional) y si acepta promociones. Conviene añadir a la política de privacidad que estos datos se usan para el programa de fidelidad. Para borrar un socio a petición suya: consola de D1 → `DELETE FROM socios WHERE telefono = '+34…';`

## Reservas en la tarjeta

En la tarjeta del cliente sale **«Mis reservas»**: las próximas y las de los últimos meses hechas con el mismo teléfono o email que la tarjeta (también las de antes de crearla). Si el cliente tiene la tarjeta en el móvil, el formulario de `/reservas/` se rellena solo con su nombre, teléfono y email.

## Petición de reseña en Google

Cuando el personal marca una reserva como **«Ha llegado»** o pone un **sello**, el cliente recibe al día siguiente (unas 20 h después) un email con el botón «Dejar mi reseña en Google». Como mucho, uno cada 90 días por email, y lleva un enlace para darse de baja. Todos reciben el mismo enlace a Google, porque Google no permite pedir reseñas solo a los clientes contentos.

- `GOOGLE_RESENA_URL` (opcional, *Variables and Secrets*): el enlace de Google Business Profile → *Pedir reseñas* (tipo `https://g.page/r/XXXX/review`), que abre directamente la ventana de escribir reseña. Si no se pone, se usa la ficha de Google Maps.
- `EMAIL_RESPUESTAS` (opcional): si el cliente responde al email, le llega a esta dirección.

## Carta editable

Panel → pestaña **CARTA** (`/admin/carta.html`): marcar un plato como **agotado hoy** (se quita solo al día siguiente), **ocultarlo**, o cambiar el nombre, la descripción y el precio. Para las bebidas, el precio y ocultarlas. Los cambios salen en `/carta` en menos de un minuto. La carta base sigue en `carta.html`. Para añadir platos nuevos o fotos hay que editar ese archivo.

## Estadísticas

Panel → pestaña **ESTADÍSTICAS** (`/admin/estadisticas.html`): visitantes por día, de dónde llegan (Google, Instagram, TikTok…), páginas más vistas, clics en Llamar / WhatsApp / Cómo llegar / Reservar y reservas online. No usa cookies ni guarda IPs (script `/estadisticas.js`, datos en la tabla `visitas`). Para saber qué publicación de Instagram trae gente, añade `?utm_source=instagram` al enlace de la bio.
