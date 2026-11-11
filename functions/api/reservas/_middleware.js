// Crear reservas desde la web: cerrado al público si RESERVAS_PRIVADAS (ver functions/_privado.js)
import { cerrar, RESERVAS_PRIVADAS } from '../../_privado.js';
export const onRequest = cerrar(RESERVAS_PRIVADAS, ['/api/reservas/crear']);
