// APIs de cliente de la tarjeta de puntos: cerradas al público si FIDELIDAD_PRIVADA (ver functions/_privado.js)
import { cerrar, FIDELIDAD_PRIVADA } from '../../_privado.js';
export const onRequest = cerrar(FIDELIDAD_PRIVADA, ['/api/fidelidad/registro', '/api/fidelidad/acceso', '/api/fidelidad/tarjeta', '/api/fidelidad/reservas']);
