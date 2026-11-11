// /reservas/ (formulario público) cerrado si RESERVAS_PRIVADAS; /reservas/admin sigue abierto (pide contraseña)
import { cerrar, RESERVAS_PRIVADAS } from '../_privado.js';
export const onRequest = cerrar(RESERVAS_PRIVADAS, ['/reservas/', '/reservas'], { pagina: true });
