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
- **reportes_semanales**: `id`, `red_id`, `semana_inicio`, `semana_fin`, `total_miembros`, `total_fieles` (calculado o manual), `total_nuevos` (calculado o manual), `se_congregan`, `discipulados` (texto libre: llamadas/visitas de la semana), `ofrenda`, `material_id`, `capitulo_actual`, `comentario_lider`, `creado_por`, `creado_en`
- **asistencia_semanal**: `id`, `reporte_id`, `miembro_id` (nulo si es alguien nuevo), `nombre` (si es nuevo), `tipo` (`fiel` | `nuevo`), `asistio` (bool) — "faltaron" = miembros del roster sin registro de asistencia esa semana
- **fotos_reporte**: `id`, `reporte_id`, `ruta_storage`, `subida_por` (máx. 2 filas por `reporte_id`, validar en la capa de aplicación)
- **usuarios/perfiles**: `id` (ligado a `auth.users` de Supabase), `nombre_completo`, `rol` (`pastor` | `admin` | `mentor` | `lider`), `red_id` (si es líder), `mentor_id` (si es mentor)

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
- **Alta de usuarios**: solo por invitación del admin, no registro público. Esto es una decisión de producto/flujo de la app (el admin crea la cuenta + su fila en `perfiles` con rol y red asignados desde el panel de admin — usar `supabase.auth.admin.inviteUserByEmail()` en el backend de Next.js cuando se construya esa pantalla), **pero además hay que desactivar manualmente el registro público a nivel de proyecto** en el dashboard de Supabase: `Authentication → Sign In / Providers → Email` (`/dashboard/project/ezsbcqhgyttmklzkkjkp/auth/providers`), desactivando la opción de permitir que cualquiera se registre por su cuenta. Esto no se puede hacer por SQL/migración — es configuración de Auth, no de la base de datos. **Pendiente de que alguien con acceso al dashboard lo confirme/active.**

## Sistema de diseño (del bosquejo/Artifact)

El mockup visual ya definió una dirección de diseño concreta — al construir los componentes reales, seguir esta paleta y tipografía en vez de inventar una nueva:

- **Estilo**: "glassmorphism" — paneles translúcidos con `backdrop-filter: blur()` sobre un fondo casi blanco con un tinte lila muy sutil (no lila saturado).
- **Tipografía**: Fraunces (serif, para títulos), Work Sans (sans, cuerpo), IBM Plex Mono (datos numéricos/tabulares).
- **Colores de acento**: violeta (`#6E4FA3` en modo claro) como acento principal; verde/ámbar/terracota/azul como colores semánticos (al día / atrasado / faltó / nuevo).
- **Estructura de la página**: hero con el nombre de la semana → franja de totales generales (5 tarjetas) → tabla compacta con filas expandibles (una fila por red) → carrusel de tarjetas de portada por red → panel de detalle que se actualiza según la tarjeta seleccionada.
- Diseño pensado para ambos temas (claro/oscuro) y para verse bien en celular (los líderes probablemente reportan desde el teléfono).

## Aclaración sobre archivos de bosquejo

Si ves referencias a `index.html` o `main.dc.html` en discusiones previas del proyecto: eso es terminología del **Design Canvas** (herramienta de Claude para maquetar visualmente), **no** la estructura de este repositorio. Next.js no usa un `index.html` suelto — la página principal real es [`app/page.tsx`](app/page.tsx).

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
