// /fidelidad/ y la tarjeta del cliente cerradas si FIDELIDAD_PRIVADA; /fidelidad/admin sigue abierto (pide contraseña)
import { cerrar, FIDELIDAD_PRIVADA } from '../_privado.js';
export const onRequest = cerrar(FIDELIDAD_PRIVADA, ['/fidelidad/', '/fidelidad', '/fidelidad/tarjeta'], { pagina: true });
