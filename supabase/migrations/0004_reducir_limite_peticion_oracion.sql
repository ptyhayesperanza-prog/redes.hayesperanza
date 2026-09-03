-- El equipo pidio bajar el limite de la peticion de oracion de 500 a
-- 200 caracteres (ver CLAUDE.md).
alter table peticiones_oracion drop constraint peticiones_oracion_descripcion_check;
alter table peticiones_oracion add constraint peticiones_oracion_descripcion_check check (char_length(descripcion) <= 200);
