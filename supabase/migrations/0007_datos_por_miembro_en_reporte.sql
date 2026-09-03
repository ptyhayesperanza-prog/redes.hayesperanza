-- El equipo pidio que "se congregan", "ofrenda" (solo si dio, sin
-- monto individual por privacidad), "discipulados" y "comentario"
-- pasen a registrarse POR MIEMBRO, no como un solo dato para toda la
-- red. Material de estudio/capitulo se queda a nivel de red (todos
-- estudian juntos). Ver CLAUDE.md.
--
-- Implicacion de diseno: antes "falto" = el miembro no tenia NINGUNA
-- fila en asistencia_semanal esa semana. Ahora un miembro puede tener
-- fila (con datos de discipulado/comentario) sin haber asistido -- por
-- ejemplo, el lider llamo a alguien que falto. "Faltaron" se sigue
-- calculando solo, pero ahora comparando asistio = false/sin fila, no
-- solo la ausencia de fila.
alter table asistencia_semanal
  add column se_congrega boolean not null default false,
  add column dio_ofrenda boolean not null default false,
  add column discipulado text check (char_length(discipulado) <= 200),
  add column comentario_miembro text check (char_length(comentario_miembro) <= 200);
