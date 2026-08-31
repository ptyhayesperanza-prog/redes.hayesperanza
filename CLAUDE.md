# CLAUDE.md

Contexto técnico para trabajar en este repositorio con Claude Code (o cualquier colaborador nuevo). Este documento es la fuente de verdad de las decisiones tomadas durante la fase de planeación — antes de escribir código, léelo completo.

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

## Modelo de datos (Supabase / Postgres)

Tablas principales:

- **mentores**: `id`, `nombre`
- **redes**: `id`, `nombre`/número (ej. "Red 017"), `lider_colider_anfitrion` (texto), `mentor_id`, `activa`
- **miembros_red**: `id`, `red_id`, `nombre`, `activo` — el roster fijo de cada red
- **materiales**: `id`, `titulo` (ej. "Nuevos Comienzos")
- **temas_material**: `id`, `material_id`, `numero_capitulo`, `titulo_tema`, `orden`
- **reportes_semanales**: `id`, `red_id`, `semana_inicio`, `semana_fin`, `total_miembros`, `total_fieles` (calculado o manual), `total_nuevos` (calculado o manual), `se_congregan`, `discipulados` (texto libre: llamadas/visitas de la semana), `ofrenda`, `material_id`, `capitulo_actual`, `comentario_lider`, `creado_por`, `creado_en`
- **asistencia_semanal**: `id`, `reporte_id`, `miembro_id` (nulo si es alguien nuevo), `nombre` (si es nuevo), `tipo` (`fiel` | `nuevo`), `asistio` (bool) — "faltaron" = miembros del roster sin registro de asistencia esa semana
- **fotos_reporte**: `id`, `reporte_id`, `ruta_storage`, `subida_por` (máx. 2 filas por `reporte_id`, validar en la capa de aplicación)
- **usuarios/perfiles**: `id` (ligado a `auth.users` de Supabase), `nombre_completo`, `rol` (`pastor` | `admin` | `mentor` | `lider`), `red_id` (si es líder), `mentor_id` (si es mentor)

El resumen general semanal (total de miembros, asistencia total a redes, total de nuevos, asistencia total a la congregación, total de ofrendas) es una **vista calculada** (SQL view o agregación en la capa de aplicación) que suma `reportes_semanales` de esa semana — no es una tabla que alguien llena a mano.

Permisos: usar Row Level Security de Postgres para los 4 roles, no solo lógica en el frontend.

## Sistema de diseño (del bosquejo/Artifact)

El mockup visual ya definió una dirección de diseño concreta — al construir los componentes reales, seguir esta paleta y tipografía en vez de inventar una nueva:

- **Estilo**: "glassmorphism" — paneles translúcidos con `backdrop-filter: blur()` sobre un fondo casi blanco con un tinte lila muy sutil (no lila saturado).
- **Tipografía**: Fraunces (serif, para títulos), Work Sans (sans, cuerpo), IBM Plex Mono (datos numéricos/tabulares).
- **Colores de acento**: violeta (`#6E4FA3` en modo claro) como acento principal; verde/ámbar/terracota/azul como colores semánticos (al día / atrasado / faltó / nuevo).
- **Estructura de la página**: hero con el nombre de la semana → franja de totales generales (5 tarjetas) → tabla compacta con filas expandibles (una fila por red) → carrusel de tarjetas de portada por red → panel de detalle que se actualiza según la tarjeta seleccionada.
- Diseño pensado para ambos temas (claro/oscuro) y para verse bien en celular (los líderes probablemente reportan desde el teléfono).

## Aclaración sobre archivos de bosquejo

Si ves referencias a `index.html` o `main.dc.html` en discusiones previas del proyecto: eso es terminología del **Design Canvas** (herramienta de Claude para maquetar visualmente), **no** la estructura de este repositorio. Next.js no usa un `index.html` suelto — la página principal real será `app/page.tsx` (o equivalente) una vez que se scaffoldee el proyecto.

## Pendiente de decidir (no asumir, preguntar al equipo)

- Dueño/organización del repositorio de GitHub.
- Dominio: la iglesia proveerá un subdominio propio más adelante (fecha sin confirmar); mientras tanto, subdominio gratuito de Vercel.
- ¿Ambiente de staging separado de producción, o solo producción?
- Quién hace la carga inicial de mentores/redes/miembros existentes al sistema.
- Quién puede editar el roster de una red además de su líder (¿mentor/admin también?) — no se ha confirmado explícitamente.
