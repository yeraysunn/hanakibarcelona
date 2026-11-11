// Crear reservas desde la web: cerrado al público mientras PRIVADO (ver functions/_privado.js)
import { cerrar } from '../../_privado.js';
export const onRequest = cerrar(['/api/reservas/crear']);
