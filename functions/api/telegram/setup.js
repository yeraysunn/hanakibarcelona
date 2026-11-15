// GET /api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET> — conecta los botones del bot con la web (una vez, o si cambia la clave del bot)
// Llama a setWebhook (<origen>/api/telegram/webhook) y devuelve un diagnóstico SIN enseñar la clave del bot.
// Si el bot ya mandaba sus avisos a otra web (p. ej. es el bot de otro local), NO la pisa salvo que se añada &forzar=1.
import { tg, mismoSecreto } from '../reservas/_telegram.js';

const salida = (datos, status = 200) => new Response(JSON.stringify(datos, null, 2), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secreto = String(env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  const token = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  const grupo = String(env.TELEGRAM_CHAT_ID || '').split(',')[0].trim();
  if (!secreto) return salida({ ok: false, error: 'Falta el secreto TELEGRAM_WEBHOOK_SECRET en Cloudflare (y volver a publicar).' }, 500);
  if (!mismoSecreto(url.searchParams.get('key'), secreto)) return salida({ ok: false, error: 'Clave incorrecta.' }, 403);

  const formato = /^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(token);
  const diag = {
    clave_bot: {
      longitud: token.length,
      formato_ok: formato,
      pista: !token ? 'Falta TELEGRAM_BOT_TOKEN.'
        : !token.includes(':') ? 'Solo está la parte de antes de los dos puntos: pega la clave completa de @BotFather ("números:texto").'
        : formato ? 'Formato correcto.' : 'Formato raro: debe ser "números:texto", sin espacios ni comillas.',
    },
    grupo: grupo || 'falta TELEGRAM_CHAT_ID',
    secreto_formato_ok: /^[A-Za-z0-9_-]{1,256}$/.test(secreto) ? true : 'Solo letras, números, _ y - (máx. 256)',
  };
  if (!formato || diag.secreto_formato_ok !== true) return salida({ ok: false, diagnostico: diag }, 400);

  try {
    const yo = await tg(env, 'getMe', {});
    diag.bot = '@' + yo.username;
    const destino = `${url.origin}/api/telegram/webhook`;
    const antes = await tg(env, 'getWebhookInfo', {});
    diag.webhook_anterior = antes.url || '(ninguno)';
    if (antes.url && antes.url !== destino && url.searchParams.get('forzar') !== '1') {
      return salida({ ok: false, error: `Este bot ya manda sus avisos a otra web (${antes.url}). Si es el bot de otro local, crea uno nuevo para Hanaki BCN. Para moverlo aquí de todos modos, añade &forzar=1.`, diagnostico: diag }, 409);
    }
    await tg(env, 'setWebhook', { url: destino, secret_token: secreto, allowed_updates: ['callback_query'] });
    if (grupo) {
      try {
        const g = await tg(env, 'getChat', { chat_id: grupo });
        diag.grupo_nombre = g.title || g.first_name;
      } catch { diag.grupo_nombre = 'El bot no ve el grupo: ¿está añadido y el TELEGRAM_CHAT_ID es correcto (empieza por -100…)?'; }
    }
    diag.webhook = (await tg(env, 'getWebhookInfo', {})).url;
  } catch (e) {
    return salida({ ok: false, error: String(e.message), diagnostico: diag }); // 200: Cloudflare tapa los 502 con su página
  }
  return salida({ ok: true, diagnostico: diag });
}
