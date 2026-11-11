// APIs de cliente de la tarjeta de puntos: cerradas al público mientras PRIVADO (ver functions/_privado.js)
import { cerrar } from '../../_privado.js';
export const onRequest = cerrar(['/api/fidelidad/registro', '/api/fidelidad/acceso', '/api/fidelidad/tarjeta', '/api/fidelidad/reservas']);
