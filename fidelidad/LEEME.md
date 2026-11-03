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
