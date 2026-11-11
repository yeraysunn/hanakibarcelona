// /fidelidad/ y la tarjeta del cliente cerradas mientras PRIVADO; /fidelidad/admin sigue abierto (pide contraseña)
import { cerrar } from '../_privado.js';
export const onRequest = cerrar(['/fidelidad/', '/fidelidad', '/fidelidad/tarjeta'], { pagina: true });
