# CLAUDE.md

@AGENTS.md

Contexto técnico para trabajar en este repositorio con Claude Code (o cualquier colaborador nuevo). Este documento es la fuente de verdad de las decisiones tomadas durante la fase de planeación — antes de escribir código, léelo completo. `AGENTS.md` (referenciado arriba) lo mantiene automáticamente `next dev` con reglas específicas de la versión de Next.js instalada — no editarlo a mano.

## Qué es esto

Reemplazo del informe semanal de Word de "Redes Hay Esperanza" (grupos pequeños de una iglesia). Varios mentores supervisan varias redes; cada red tiene un líder que reporta semanalmente asistencia, material de estudio, ofrenda y comentarios. Hoy eso vive en un documento de Word desordenado; el objetivo es un formulario web + un panel de consulta.

## Decisiones de producto ya tomadas (no reabrir sin razón)

- **No es un CRM ni una app de gestión de membresía completa.** Es específicamente el reemplazo del reporte semanal.
- **Roster de miembros por red** (no texto libre): cada red mantiene una lista de sus miembros; el reporte semanal marca asistencia contra esa lista, así "faltaron" se calcula solo en vez de que el líder lo escriba de memoria cada semana.
- **Vista de asistencia con dos niveles**: por defecto se muestra solo el número total de asistencia. Al expandir, se ve el desglose: fieles, nuevos/visitas, y faltaron (con nombres).
- **Visibilidad de nombres**: los nombres de asistentes son visibles para mentor y pastor también, siempre que hagan clic para expandir — no hay restricción de privacidad adicional por rol.
- **Material de estudio — versión simple**: se registra libro + capítulo actual por red. Comparar el avance ("quién va atrasado") se hace comparando las redes entre sí, **no** contra un plan de estudio oficial con fechas. (Se decidió explícitamente no construir la versión con calendario/plan oficial, al menos por ahora.)
- **Fotos**: máximo 2 por reporte semanal.
- **Sin recordatorios automáticos** (no se construye ningún sistema de notificaciones a líderes que no han reportado).
- **Sin migración de datos históricos**: el sistema arranca de cero desde la primera semana en que se use. No se migran los Word viejos.
- **Los reportes semanales NO se consolidan**: cada semana es su propio registro/exportable independiente (su propio PDF/Excel al exportar). No existe un archivo único acumulado de todas las semanas.
- **Las categorías originales del Word se preservan todas** — ver la lista completa en el modelo de datos abajo. Ninguna se elimina; solo se reorganiza la forma de capturarlas.
- **Edición del roster de una red**: solo el líder de esa red y el rol admin pueden agregar/editar/quitar miembros del roster. El mentor tiene acceso de solo lectura sobre el roster de las redes que supervisa (igual que sobre los reportes).
- **Ambientes**: solo producción por ahora (un proyecto de Supabase, un deploy de Vercel). No se monta un ambiente de staging separado en esta etapa.

## Modelo de datos (Supabase / Postgres)

Tablas principales:

- **mentores**: `id`, `nombre`, `color` (color de identificación visual de la mentoría, ej. "Morado" — texto libre, no enum, porque el informe real usa nombres de color ad hoc como "Naranja peach")
- **redes**: `id`, `nombre`/número (ej. "Red 017"), `mentor_id`, `activa`, `colider` (texto), `anfitrion` (texto), `direccion`, `dia_reunion`, `horario` — el líder ya se identifica vía `perfiles.red_id`, no hace falta un campo de texto aparte
- **miembros_red**: `id`, `red_id`, `nombre`, `telefono`, `activo` — el roster fijo de cada red
- **materiales**: `id`, `titulo` (ej. "Nuevos Comienzos")
- **temas_material**: `id`, `material_id`, `numero_capitulo`, `titulo_tema`, `orden`
- **reportes_semanales**: `id`, `red_id`, `semana_inicio`, `semana_fin`, `total_miembros`, `total_fieles` (calculado o manual), `total_nuevos` (calculado o manual), `se_congregan`, `discipulados` (texto libre: llamadas/visitas de la semana — solo editable por líder/colíder), `se_recogio_ofrenda` (bool), `ofrenda` (monto, solo si `se_recogio_ofrenda`), `material_id`, `capitulo_actual`, `comentario_lider`, `dia_habitual` (bool — la red se reunió en su día/hora de siempre), `fecha_reunion`/`hora_reunion` (solo si `dia_habitual = false`), `creado_por`, `creado_en`
- **asistencia_semanal**: `id`, `reporte_id`, `miembro_id` (nulo si es alguien nuevo), `nombre` (si es nuevo), `tipo` (`fiel` | `nuevo`), `asistio` (bool), `invitado_por` (FK a `miembros_red` — qué miembro del roster trajo a esta visita, solo aplica cuando `tipo = 'nuevo'`) — "faltaron" = miembros del roster sin registro de asistencia esa semana
- **peticiones_oracion**: `id`, `reporte_id`, `miembro_id` (nulo si es de alguien fuera del roster), `nombre` (si es de alguien fuera del roster), `descripcion` (máx. 200 caracteres), `creado_en`
- **fotos_reporte**: `id`, `reporte_id`, `ruta_storage`, `subida_por` (máx. 2 filas por `reporte_id`, validar en la capa de aplicación)
- **usuarios/perfiles**: `id` (ligado a `auth.users` de Supabase), `nombre_completo`, `rol` (`pastor` | `admin` | `mentor` | `lider`), `red_id` (si es líder), `mentor_id` (si es mentor)

**Nota importante sobre "colíder"**: no es un rol nuevo. `perfiles.red_id` no tiene restricción de unicidad — el admin simplemente crea una segunda cuenta con `rol = 'lider'` apuntando a la misma red, y automáticamente tiene permisos idénticos al líder sobre esa red (las políticas de RLS ya funcionan así, sin ningún cambio). El campo `redes.colider` (texto) sigue existiendo como referencia/etiqueta, independiente de si esa persona tiene o no una cuenta propia.

**Función `miembro_es_fiel(miembro_id, meses default 3)`**: calcula al vuelo (no se guarda) si un miembro asistió a más de la mitad de los reportes de su red en los últimos N meses. Esto es distinto del campo `asistencia_semanal.tipo = 'fiel'`, que solo indica "es miembro del roster (no visita) que asistió esa semana" — la fidelidad real de largo plazo se consulta con esta función, no se infiere del `tipo` semanal.

**Perfil de miembro** (clic en el nombre desde el resumen semanal, visible para mentor/líder/colíder/pastor — ya cubierto por las políticas de RLS existentes de `miembros_red`, sin cambios): `nombre`, `apellido`, `correo`, `fecha_nacimiento`, `direccion`, `telefono`. La edad se calcula al momento de mostrarla (`extract(year from age(fecha_nacimiento))`), nunca se guarda como columna fija para que no quede desactualizada.

El resumen general semanal (total de miembros, asistencia total a redes, total de nuevos, asistencia total a la congregación, total de ofrendas) es una **vista calculada** (SQL view o agregación en la capa de aplicación) que suma `reportes_semanales` de esa semana — no es una tabla que alguien llena a mano.

Permisos: usar Row Level Security de Postgres para los 4 roles, no solo lógica en el frontend.

**Esquema real**: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — tablas, la vista `resumen_semanal` y las políticas RLS para los 4 roles. Ya está **aplicado y verificado** (sin advertencias de seguridad ni rendimiento en el advisor de Supabase) en el proyecto real:

- Proyecto Supabase: `redes-hayesperanza` (`ezsbcqhgyttmklzkkjkp`), org `vannhls`, región `us-east-1`.
- Nota: quién puede *borrar* un reporte semanal (no solo crear/editar) no estaba definido explícitamente; por ahora la migración lo deja solo para admin — revisar si el líder también debería poder borrar un reporte propio antes de enviarlo.

**Auditoría de seguridad (2026-08-31)**: se revisó manualmente más allá del advisor automático de Supabase (políticas completas, grants de tabla, pruebas funcionales con usuarios simulados en transacciones revertidas). Se encontró y corrigió:

- 🔴 **Crítico, ya corregido**: `perfiles_update_propio` no tenía `WITH CHECK` propio, así que cualquier líder o mentor podía editar su propia fila y cambiarse `rol` a `admin` (o su `red_id`/`mentor_id`) — escalación total de privilegios con un solo UPDATE. Se agregó el trigger `private.prevent_perfiles_self_escalation` que bloquea cambios a `rol`/`red_id`/`mentor_id` salvo que quien edita ya sea admin. Verificado con una prueba funcional (intento de auto-escalación bloqueado; edición legítima del propio nombre sí funciona).
- 🟡 **Higiene, ya corregido**: se revocó `TRUNCATE` de `anon`/`authenticated` en todas las tablas (Supabase lo otorga por defecto). `TRUNCATE` ignora RLS por completo; no era explotable vía la API REST normal, pero es una puerta innecesaria.
- 🟡 **Integridad, ya corregido**: se agregaron triggers para que `creado_por` (en `reportes_semanales`) y `subida_por` (en `fotos_reporte`) siempre sean quien hace la petición real (salvo admin) — antes un líder podía enviar un id ajeno y falsificar autoría.
- 🟡 **Integridad, ya corregido**: trigger `private.check_asistencia_miembro_red` — evita marcar asistencia con un `miembro_id` que pertenezca al roster de otra red distinta a la del reporte.
- Aislamiento entre redes verificado funcionalmente: un líder de prueba solo pudo ver/insertar en su propia red, nunca en la de otro.

**Ajuste de esquema (2026-08-31), a partir de revisar la plantilla real del informe de Word**: se agregaron `mentores.color`, `redes.colider/anfitrion/direccion/dia_reunion/horario`, y `miembros_red.telefono` — ver [`supabase/migrations/0002_datos_red_y_mentores.sql`](supabase/migrations/0002_datos_red_y_mentores.sql). Se confirmó que `ofrenda` se queda como monto en $ (no como sí/no). Los 7 mentores reales ya están cargados con su color:

| Mentor | Color |
|---|---|
| Perla y Edwin Rodríguez | Morado |
| Cesar y Yara Córdoba | Turquesa |
| Norma de Torrijos | Blanco |
| Migdalia de Delgado | Rojo |
| Lucy de Candanedo | Verde |
| Pastor Eliel | Azul |
| Pastor Marco | Naranja peach |

A partir de esta migración, los cambios de esquema se documentan en migraciones incrementales nuevas (`0002_*`, `0003_*`, ...) en vez de reescribir `0001_init.sql` — ese archivo ya se trató como "estado ya aplicado" varias veces mientras el proyecto todavía no tenía datos reales; ahora que sí los tiene, reescribirlo retroactivamente dejaría de reflejar la realidad de cómo se llegó al estado actual.

**Resuelto (2026-08-31)**:

- **Fotos / Storage**: bucket privado `fotos-reportes` creado (`public = false`), servido solo vía RLS — nunca por URL pública directa. Convención de ruta: `fotos-reportes/{reporte_id}/{archivo}`. Las políticas de `storage.objects` reutilizan la misma lógica de visibilidad que `fotos_reporte` (líder de esa red / mentor de esa red / pastor / admin). Verificado con prueba funcional: un líder de prueba solo pudo ver el objeto de su propio reporte, no el de otra red.
- ~~**Alta de usuarios**: solo por invitación del admin~~ — **decisión revertida el 2026-09-03**, ver la sección "Autoregistro" más abajo. El registro público debe quedar **habilitado** (es el comportamiento por defecto de Supabase; nunca llegamos a desactivarlo, así que no hay que tocar nada en el dashboard para esto).

## Sistema de diseño (del bosquejo/Artifact)

El mockup visual ya definió una dirección de diseño concreta — al construir los componentes reales, seguir esta paleta y tipografía en vez de inventar una nueva:

- **Estilo**: "glassmorphism" — paneles translúcidos con `backdrop-filter: blur()` sobre un fondo casi blanco con un tinte lila muy sutil (no lila saturado).
- **Tipografía**: Fraunces (serif, para títulos), Work Sans (sans, cuerpo), IBM Plex Mono (datos numéricos/tabulares).
- **Colores de acento**: violeta (`#6E4FA3` en modo claro) como acento principal; verde/ámbar/terracota/azul como colores semánticos (al día / atrasado / faltó / nuevo).
- **Estructura de la página**: hero con el nombre de la semana → franja de totales generales (5 tarjetas) → tabla compacta con filas expandibles (una fila por red) → carrusel de tarjetas de portada por red → panel de detalle que se actualiza según la tarjeta seleccionada.
- Diseño pensado para ambos temas (claro/oscuro) y para verse bien en celular (los líderes probablemente reportan desde el teléfono).

## Aclaración sobre archivos de bosquejo

Si ves referencias a `index.html` o `main.dc.html` en discusiones previas del proyecto: eso es terminología del **Design Canvas** (herramienta de Claude para maquetar visualmente), **no** la estructura de este repositorio. Next.js no usa un `index.html` suelto — la página principal real es [`app/page.tsx`](app/page.tsx).

## Formulario de reporte semanal (2026-09-01)

Construido y probado de punta a punta contra el Supabase real (login → formulario → guardado → subida de fotos), incluyendo un bug real encontrado y corregido en el camino.

**Páginas nuevas**:
- `/login`, `/recuperar`, `/actualizar-contrasena`: login por correo/contraseña + flujo oficial de recuperación de contraseña de Supabase (sin que la app conozca contraseñas ajenas).
- `/reportar`: el formulario real para el rol líder — roster con checkboxes de asistencia (lo no marcado = "faltaron", calculado solo), lista dinámica de visitas/nuevos, se_congregan, ofrenda, material+capítulo, discipulados, comentario. `app/reportar/actions.ts` es el server action que inserta en `reportes_semanales` + `asistencia_semanal`.
- `/reportar/exito`: tras guardar, permite subir hasta 2 fotos directo al bucket privado (`fotos-reportes`), insertando su fila en `fotos_reporte`.
- `app/page.tsx`: redirige según rol (líder → `/reportar`; sin sesión → `/login`).

**Bug real encontrado y corregido**: al crear usuarios de `auth.users` directamente por SQL (bootstrap, sin `service_role` key), los campos de token (`confirmation_token`, `recovery_token`, `email_change*`, etc.) quedaron en `NULL` en vez de `''`. Eso rompía el login con `"Database error querying schema"` (500) del lado de GoTrue. Si se crean más usuarios por SQL en el futuro, hay que setear esos campos a `''` explícitamente.

**Cuentas creadas**:
- **Admin real**: `ptyhayesperanza@gmail.com`, sin contraseña utilizable todavía — se le envió el correo oficial de "restablecer contraseña" de Supabase, pero **el enlace no va a funcionar hasta que la app esté desplegada** (hoy solo corre en localhost de desarrollo). Pendiente: desplegar a Vercel o dar una contraseña temporal manualmente.
- **Líder de prueba** (datos ficticios, para pruebas): `lider.prueba@example.com` / `PruebaLider2026!`, asignado a "Red de Prueba" (3 miembros ficticios). Reemplazar por datos reales cuando se cargue la primera red real.

**Huecos que quedaron fuera de esta pasada** (no construidos aún, no son bugs): edición/borrado de reportes ya enviados, catálogo de `materiales`/`temas_material` (está vacío — el selector de material en el formulario no tiene opciones todavía), panel de consulta para mentor/pastor/admin, y el despliegue a Vercel.

## Funcionalidades avanzadas pedidas por el equipo (2026-09-03)

El equipo pidió un lote de cambios adicionales sobre el reporte semanal. Aplicados en la base de datos real ([`supabase/migrations/0003_funcionalidades_avanzadas.sql`](supabase/migrations/0003_funcionalidades_avanzadas.sql)) **y ya expuestos en el formulario** — ver la sección "Formulario con datos por miembro" más abajo para el estado final de la UI.

- **Colíder con cuenta propia**: ver nota en "Modelo de datos" arriba — no es un rol nuevo, es una segunda cuenta `rol = 'lider'` en la misma red.
- **Ofrenda**: ahora es `se_recogio_ofrenda` (sí/no) + `ofrenda` (monto, solo si hubo).
- **Cambio de día de reunión**: `dia_habitual` (bool) + `fecha_reunion`/`hora_reunion` si la respuesta es "no".
- **Visitas con trazabilidad**: `asistencia_semanal.invitado_por` conecta a la visita nueva con el miembro del roster que la trajo (validado por trigger: debe ser de la misma red).
- **Petición de oración**: tabla `peticiones_oracion`, ligada a un miembro específico (o a un nombre si es de alguien fuera del roster), máximo 200 caracteres (bajado de 500 a pedido del equipo — ver [`0004_reducir_limite_peticion_oracion.sql`](supabase/migrations/0004_reducir_limite_peticion_oracion.sql)).
- **Perfil de miembro**: `miembros_red` ganó `apellido`, `correo`, `fecha_nacimiento`, `direccion` — pensado para un modal/popup al hacer clic en el nombre del miembro en el resumen semanal.
- **Miembro fiel real**: función `miembro_es_fiel(miembro_id, meses default 3)` — ver nota arriba.

**Toggle pendiente en el dashboard de Supabase** (no se puede hacer por SQL/migración): `Authentication → Policies → Password` tiene la protección contra contraseñas filtradas (HaveIBeenPwned) desactivada — el advisor de seguridad lo marca como advertencia. Recomendado activarlo, sobre todo ahora que hay autoregistro público (ver abajo).

## Autoregistro y aprobación de admin (2026-09-03)

El equipo pidió que líderes, colíderes, mentores y pastor puedan crear su propia cuenta en vez de que el admin invite a cada uno — esto **reemplaza** la decisión anterior de "solo por invitación" (ver nota tachada arriba). Construido y probado de punta a punta.

**Cómo funciona**: cualquiera puede registrarse (correo + contraseña) en `/registro`, pero esa cuenta **no tiene ningún acceso a nada** hasta que un admin le asigna rol y red/mentor desde `/admin/usuarios`. Esto no necesitó ningún cambio de RLS — ya funcionaba así por diseño (sin fila en `perfiles`, `private.current_rol()` devuelve `NULL` y todas las políticas comparan contra eso). El único código nuevo es la función `listar_usuarios_pendientes()` (security definer, gateada por `current_rol() = 'admin'` — no es una vista, para no disparar el lint de "security definer view"; ver [`0005_autoregistro_y_aprobacion_admin.sql`](supabase/migrations/0005_autoregistro_y_aprobacion_admin.sql)), que le muestra al admin quién se registró sin perfil todavía.

**Páginas nuevas**:
- `/registro`: formulario de autoregistro (nombre, correo, contraseña) — `supabase.auth.signUp()`.
- `/admin/usuarios`: panel de admin — lista a los pendientes (`listar_usuarios_pendientes()`), con un formulario por persona para asignar rol y, según el rol, la red (líder) o el mentor del catálogo (mentor). Server action `asignarPerfil` en `app/admin/usuarios/actions.ts`.
- `app/page.tsx` ahora distingue tres casos: sin sesión → `/login`; con sesión pero sin perfil → pantalla "cuenta pendiente de aprobación"; con perfil → como antes. `getUsuarioActual()` ya no trata "sin perfil" como "no autenticado".

**Bug real encontrado y corregido**: Supabase otorga `EXECUTE` en funciones nuevas directamente a los roles `anon`/`authenticated` (no solo vía `PUBLIC`) — `revoke ... from public` no bastó para quitarle acceso a `anon`; hubo que revocarlo explícitamente de `anon` y `authenticated` antes de re-otorgar solo a `authenticated`. También: `auth.users.email` es `varchar(255)`, no `text` — la función fallaba con "structure of query does not match function result type" hasta castear con `::text`.

**Cuenta de prueba nueva**: `mentor.prueba@example.com` / `MentorPrueba2026!`, ya aprobada con rol mentor (mentor real: Cesar y Yara Córdoba). También queda `pendiente.prueba@example.com` / `PendientePrueba2026!` sin aprobar, a propósito, para poder ver la pantalla de "cuenta pendiente" — bórrala cuando ya no haga falta de referencia.

## Rediseño visual de login/registro + selector de mentoría/red (2026-09-03)

El equipo compartió dos mockups HTML propios en `components/` (`redes-de-crecimiento.html` = login/signup con panel de marca verde; `seleccion-mentoria-red.html` = wizard de registro con tarjetas para elegir mentoría y red) como base visual, pidiendo cambiar el verde por morado/lila.

**Conflicto real encontrado y resuelto con el equipo**: `seleccion-mentoria-red.html` dejaba que la persona que se registra **eligiera directamente** su mentoría y su red, sin aprobación — exactamente el hueco de seguridad que se cerró en la sección anterior. Se acordó una tercera vía: el usuario elige en el formulario (UX del mockup, intacta), pero eso queda guardado como **sugerencia** en `raw_user_meta_data` de `auth.users` (`rol_sugerido`, `red_id_sugerida`, `mentor_id_sugerido`) — sigue sin dar ningún acceso real. El admin ve la sugerencia en `/admin/usuarios` y la confirma o la cambia antes de asignar de verdad. Ver [`0006_sugerencia_rol_red_en_registro.sql`](supabase/migrations/0006_sugerencia_rol_red_en_registro.sql).

**Logo real encontrado**: el mockup traía el logo oficial de "Hay Esperanza" embebido como base64 (PNG blanco 1080×1080) — se extrajo a [`public/logo-hay-esperanza.png`](public/logo-hay-esperanza.png) en vez de dejarlo como texto gigante dentro del código.

**Qué se construyó**:
- Tokens nuevos en `app/globals.css`: `--accent-deep` (para el degradado del panel de marca) y `--gold` (acento secundario decorativo, tomado del mockup). El verde (`--green`/`--green-deep`) del mockup se mapeó 1:1 a los tokens violeta ya existentes del proyecto.
- [`components/AuthBrandPanel.tsx`](components/AuthBrandPanel.tsx): el panel de marca izquierdo (degradado violeta, logo, wordmark, arte de red decorativo en SVG, cita) — reutilizado en `/login` y `/registro`. Se oculta en móvil a favor de `AuthMobileHeader` (logo + wordmark compactos), igual que el mockup original.
- [`components/CardPicker.tsx`](components/CardPicker.tsx): selector de tarjetas genérico y reutilizable (usado para elegir rol, red, y mentor tanto en `/registro` como en `/admin/usuarios`) — reemplaza los `<select>` planos que tenía antes el panel de admin.
- [`lib/colorMentor.ts`](lib/colorMentor.ts): mapeo de los 7 nombres de color reales de los mentores (Morado, Turquesa, Blanco, Rojo, Verde, Azul, Naranja peach) a un hex, para pintar cada tarjeta de mentor con su color de identificación.
- `/registro` ahora es un wizard progresivo: datos básicos → rol (tarjetas) → red (si líder) o mentor (si mentor), con las listas reales de `redes`/`mentores` — no hay paso extra si el rol es pastor.
- `/admin/usuarios` prellenar las tarjetas con la sugerencia (editable) en vez de empezar en blanco.

**Funciones públicas nuevas** (a propósito, sin gate de admin — solo exponen `id`+`nombre`(+`color`), nada sensible como dirección/horario/roster): `listar_redes_publico()` y `listar_mentores_publico()`, otorgadas a `anon` y `authenticated` — necesarias porque alguien en `/registro` (sin sesión, o con sesión pero sin perfil) no puede leer las tablas reales `redes`/`mentores` (correctamente restringidas por RLS). El advisor de seguridad marca 4 warnings por esto (`anon`/`authenticated` pueden ejecutar una función security definer) — son **esperados y aceptados**, igual que los de `listar_usuarios_pendientes()`.

**Bug real encontrado y corregido**: `DROP FUNCTION` + `CREATE FUNCTION` reinicia los grants de Supabase a su default (`PUBLIC`, `anon` y `authenticated` quedan con `EXECUTE` otra vez) — hubo que revocar de los **tres** explícitamente (revocar solo de `anon` no alcanza si `PUBLIC` todavía tiene el grant, porque `anon` hereda de `PUBLIC`). Ya documentado como comentario en la migración para no repetir el error.

Probado de punta a punta en el navegador: layout de dos paneles con el logo real, wizard de registro completo (datos → rol → red, con la red real de la base de datos), y panel de admin mostrando y pre-llenando la sugerencia correctamente (verificado también contra la base de datos, no solo visualmente).

**Nota de límite de envíos de correo**: el servicio de correo integrado de Supabase (gratis) tiene un límite bajo de envíos por hora — ya lo agotamos varias veces esta sesión probando recuperación de contraseña y registro. Si el equipo prueba registro/recuperación real y no llega el correo, probablemente sea eso, no un bug. Se resuelve configurando un proveedor de correo propio (SMTP) en producción — pendiente, no urgente mientras estemos en pruebas.

## Formulario con datos por miembro (2026-09-03)

El equipo aclaró que varios campos que estaban a nivel de todo el reporte en realidad deben capturarse **por cada miembro del roster**. Se resolvió campo por campo (no todos tenían el mismo sentido "por persona"):

- **Se congregan**: pasó de número manual a un check por miembro (`asistencia_semanal.se_congrega`) — el total (`reportes_semanales.se_congregan`) ahora se calcula solo, contando los checks, igual que `total_fieles`.
- **Ofrenda por persona**: check `asistencia_semanal.dio_ofrenda` (solo si dio o no, **sin monto individual**, por privacidad). El monto total de la ofrenda de toda la red se queda igual que antes (`se_recogio_ofrenda` + `ofrenda`), sin dividir por persona.
- **Material de estudio / capítulo**: se quedó a nivel de red — no tenía sentido que cada miembro fuera en un capítulo distinto de un estudio grupal.
- **Discipulados y comentario**: se agregaron `asistencia_semanal.discipulado` y `asistencia_semanal.comentario_miembro` (≤200 caracteres cada uno) como notas **por persona**. Se conservaron también los campos generales `reportes_semanales.discipulados`/`comentario_lider` para una nota general de la semana que no es sobre alguien en particular — no se eliminaron, se agregó la versión por persona además.

**Cambio de diseño importante**: antes "faltó" significaba que el miembro no tenía ninguna fila en `asistencia_semanal` esa semana. Ahora un miembro puede tener fila (con nota de discipulado, por ejemplo) sin haber asistido — el líder puede registrar que llamó a alguien que faltó. La fila se crea si hay *cualquier* dato (asistió, se congrega, dio ofrenda, o alguna nota); si no hay absolutamente nada, sigue sin crearse fila, igual que antes. Ver [`0007_datos_por_miembro_en_reporte.sql`](supabase/migrations/0007_datos_por_miembro_en_reporte.sql).

**El formulario `/reportar` quedó reconstruido por completo**, ahora sí exponiendo todo lo de las dos secciones anteriores:
- Encabezado llamativo con el día/hora/dirección habitual de la red.
- Toggle "¿se reunió en su día habitual?" con fecha/hora reales si la respuesta es no.
- Cada miembro del roster en su propia tarjeta ([`MiembroRow.tsx`](app/reportar/MiembroRow.tsx)) con los 3 checks + las 2 notas cortas, y su nombre es clicable — abre [`MemberProfileModal.tsx`](app/reportar/MemberProfileModal.tsx) con apellido/edad/teléfono/correo/dirección/cumpleaños.
- Visitas nuevas con selector de "quién la invitó" (roster).
- Ofrenda de la red, material/capítulo, notas generales.
- Peticiones de oración dinámicas (persona del roster o nombre libre + descripción).

**Bugs reales encontrados y corregidos**:
- **Cumpleaños se mostraba un día antes** (13 de mayo en vez de 14): `new Date("1990-05-14")` interpreta la fecha como medianoche UTC; en una zona horaria detrás de UTC (Panamá) eso cae en el día anterior al convertir a hora local. Se parsea la fecha a mano (`parsearFechaLocal` en `MemberProfileModal.tsx`) en vez de dejar que el constructor de `Date` asuma UTC. **Aplica a cualquier campo `date` que se muestre — revisar si aparece en otro lado.**
- **Insert masivo con columnas `not null` fallaba para las visitas**: al insertar en una sola llamada filas de miembros (que sí traen `se_congrega`/`dio_ofrenda`) junto con filas de visitas (que no las traían), Supabase arma un solo INSERT con la unión de columnas de todas las filas — a las filas que no traen una clave les manda `NULL` explícito, no el valor por defecto de la columna. Como esas columnas son `not null default false`, el `NULL` explícito violaba la restricción. Se corrigió repitiendo los valores por defecto a mano en cada fila del array antes de insertar. **Aplica a cualquier insert masivo futuro con arrays de objetos de forma distinta.**

Probado de punta a punta en el navegador contra el Supabase real: los 3 checks y las 2 notas por miembro, la visita con su invitador, la ofrenda de red, el material/capítulo, las notas generales, y una petición de oración — todo verificado también contra la base de datos (no solo visualmente). Se confirmó que un miembro sin ningún dato marcado no genera fila (sigue "faltando" correctamente).

## Carga real de mentorías, líderes y numeración de redes (2026-09-04)

El equipo entregó la lista real de las 30 redes activas (mentoría → líder → número), aplicada en [`supabase/migrations/0008_carga_real_redes_y_mentores.sql`](supabase/migrations/0008_carga_real_redes_y_mentores.sql). Reemplaza el estado anterior en que solo existía "Red de Prueba" (que se dejó intacta — la usan las cuentas de prueba).

- **Nuevo campo `redes.lider_referencia` (texto)**: la mayoría de estos líderes reales todavía no tiene cuenta creada, así que no hay ninguna fila en `perfiles` que los identifique todavía (eso solo pasa cuando el líder se autoregistra y el admin lo aprueba — ver "Autoregistro" arriba). Este campo es **solo de referencia/visualización** (igual que `colider`) para que las tarjetas de red y el selector de `/registro` muestren su nombre mientras tanto; no da ningún permiso ni reemplaza a `perfiles.red_id` como fuente de verdad una vez que el líder real se registra.
- Convención de `redes.nombre`: `"Red 0XX"` (con el número tal cual lo usa el equipo, ej. "Red 016").
- `listar_redes_publico()` ahora también devuelve `mentor_id` y `lider_referencia` (antes solo `id`+`nombre`) — necesario para agrupar las redes por mentoría en el selector de `/registro` (con 30 redes, una lista plana ya no alcanza) y para que el líder reconozca su propia tarjeta por nombre, no solo por número. Se actualizó también `/admin/usuarios` (que lee `redes` directo, no vía la función) para el mismo flujo de dos pasos (mentoría → red).
- Conteo cargado por mentoría: Lucy de Candanedo (7), Cesar y Yara Córdoba (5), Migdalia de Delgado (3), Pastor Eliel (6), Pastor Marco (1), Perla y Edwin Rodríguez (4), Norma de Torrijos (4).

## Estado del scaffold de Next.js (2026-08-31)

Ya está armado y verificado corriendo contra el Supabase real:

- Next.js 16 (App Router, TypeScript, Turbopack) + Tailwind CSS v4.
- `@supabase/ssr` + `@supabase/supabase-js`: [`lib/supabase/client.ts`](lib/supabase/client.ts) (browser), [`lib/supabase/server.ts`](lib/supabase/server.ts) (Server Components), [`lib/supabase/middleware.ts`](lib/supabase/middleware.ts) + [`middleware.ts`](middleware.ts) (refresco de sesión).
- [`lib/supabase/database.types.ts`](lib/supabase/database.types.ts): tipos generados desde el esquema real (`generate_typescript_types`). Regenerar cada vez que cambie el esquema.
- Tokens de diseño y tipografías (Fraunces/Work Sans/IBM Plex Mono) aplicados en [`app/layout.tsx`](app/layout.tsx) y [`app/globals.css`](app/globals.css) — los valores de color son un punto de partida razonable siguiendo la dirección de CLAUDE.md, **no** son los valores exactos del mockup (que vive fuera del repo); ajustar cuando se porte el diseño real.
- `.env.local` (no versionado) con las credenciales del proyecto `redes-hayesperanza`; `.env.example` versionado como plantilla.
- Probado en el navegador en modo claro y oscuro: la página confirma conexión real a Supabase ("Supabase: conectado ✓").

Para correr localmente: `npm install`, copiar `.env.example` a `.env.local` con las credenciales reales (pedirlas al admin del proyecto Supabase), `npm run dev`.

Nota de entorno: en esta máquina, `npm install` requiere `--ignore-scripts` por una restricción de seguridad en `~/.npmrc` (`allow-scripts` limitado a paquetes específicos) — sin esa bandera, `npm install` falla con `EALLOWSCRIPTS`.

## Pendiente de decidir (no asumir, preguntar al equipo)

- Dominio: la iglesia proveerá un subdominio propio más adelante (fecha sin confirmar); mientras tanto, subdominio gratuito de Vercel.
- Quién hace la carga inicial de **redes y sus rosters de miembros** al sistema (los 7 mentores reales ya se cargaron, ver abajo).

## Resuelto

- **Dueño/organización del repositorio de GitHub**: [ptyhayesperanza-prog/redes.hayesperanza](https://github.com/ptyhayesperanza-prog/redes.hayesperanza.git).
- **Ambiente de staging**: no, solo producción (ver arriba).
- **Edición del roster**: líder de la red + admin (ver arriba).
