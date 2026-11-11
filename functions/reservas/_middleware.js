// /reservas/ (formulario público) cerrado mientras PRIVADO; /reservas/admin sigue abierto (pide contraseña)
import { cerrar } from '../_privado.js';
export const onRequest = cerrar(['/reservas/', '/reservas'], { pagina: true });
