-- Tarjeta de fidelidad Hanaki · base de datos Cloudflare D1
-- Se ejecuta UNA vez en la consola de la base de datos (Cloudflare > D1 > hanaki-fidelidad > Console).
-- Si la base de datos ya existía con la versión anterior, no hace falta ejecutar nada: las columnas nuevas se añaden solas.

CREATE TABLE IF NOT EXISTS socios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  token          TEXT    NOT NULL UNIQUE,          -- clave secreta de la tarjeta (va en el QR)
  codigo         TEXT    NOT NULL UNIQUE,          -- código corto para teclear si el QR falla
  nombre         TEXT    NOT NULL,
  telefono       TEXT    NOT NULL UNIQUE,
  email          TEXT,
  acepta_promos  INTEGER NOT NULL DEFAULT 0,
  sellos         INTEGER NOT NULL DEFAULT 0,       -- (antiguo, ya no se usa: ahora hay un contador por tipo)
  sellos_mediodia INTEGER NOT NULL DEFAULT 0,      -- sellos de buffet de mediodía (0-8)
  sellos_noche   INTEGER NOT NULL DEFAULT 0,       -- sellos de buffet de noche (0-8)
  sellos_menu    INTEGER NOT NULL DEFAULT 0,       -- sellos de menú (0-8)
  sellos_totales INTEGER NOT NULL DEFAULT 0,       -- todos los sellos que ha recibido
  premios        INTEGER NOT NULL DEFAULT 0,       -- premios canjeados (total)
  premios_mediodia INTEGER NOT NULL DEFAULT 0,
  premios_noche  INTEGER NOT NULL DEFAULT 0,
  premios_menu   INTEGER NOT NULL DEFAULT 0,
  creado         TEXT    NOT NULL DEFAULT (datetime('now')),
  ultimo_sello   TEXT
);

CREATE TABLE IF NOT EXISTS movimientos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  socio_id INTEGER NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
  tipo     TEXT    NOT NULL,                       -- 'sello' | 'quitar' | 'canje'
  tipo_sello TEXT,                                 -- 'mediodia' | 'noche' | 'menu'
  creado   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mov_socio  ON movimientos(socio_id);
CREATE INDEX IF NOT EXISTS idx_mov_creado ON movimientos(creado);
