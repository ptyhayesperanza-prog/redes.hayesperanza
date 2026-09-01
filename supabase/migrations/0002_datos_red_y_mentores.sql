-- Campos que el informe original en Word captura y que faltaban en el
-- esquema inicial (detectado al revisar la plantilla real del informe).
-- Ver CLAUDE.md > "Modelo de datos" para el contexto completo.

-- redes: separar colider/anfitrion del lider (el lider ya se identifica
-- via perfiles.red_id), y agregar direccion/dia/horario de reunion.
alter table redes
  add column colider text,
  add column anfitrion text,
  add column direccion text,
  add column dia_reunion text,
  add column horario text;

alter table redes drop column lider_colider_anfitrion;

-- miembros_red: telefono de cada miembro (aparece en el informe original).
alter table miembros_red add column telefono text;

-- mentores: color de identificacion visual de cada mentoria.
alter table mentores add column color text;

-- Carga inicial real de los 7 mentores existentes con su color asignado.
insert into mentores (nombre, color) values
  ('Perla y Edwin Rodríguez', 'Morado'),
  ('Cesar y Yara Córdoba', 'Turquesa'),
  ('Norma de Torrijos', 'Blanco'),
  ('Migdalia de Delgado', 'Rojo'),
  ('Lucy de Candanedo', 'Verde'),
  ('Pastor Eliel', 'Azul'),
  ('Pastor Marco', 'Naranja peach');
