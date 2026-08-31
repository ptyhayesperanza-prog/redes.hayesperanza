# Redes Hay Esperanza — Panel de Reportes Semanales

Aplicación web para reemplazar el informe semanal de Word que usan las redes (grupos pequeños) de la iglesia. Cada líder llena su reporte en un formulario en línea; el resultado se ve como un panel semanal ordenado, exportable a PDF/Excel.

**Estado actual: planeación / bosquejo.** Todavía no hay código de la aplicación en este repositorio — este README y `CLAUDE.md` documentan las decisiones tomadas hasta ahora para que el desarrollo arranque con contexto completo, en vez de sobre una pizarra en blanco.

El bosquejo visual (mockup interactivo, sin datos reales) vive fuera del repo, en un Artifact de Claude. Pídele el link a quien lo generó si necesitas verlo.

## Stack

- **Frontend + backend**: [Next.js](https://nextjs.org/) (TypeScript)
- **Base de datos, autenticación y almacenamiento de fotos**: [Supabase](https://supabase.com/) (Postgres gestionado, gratis en este volumen)
- **Hosting**: [Vercel](https://vercel.com/), desplegado automáticamente desde la rama `main`
- **Dominio**: pendiente — la iglesia va a proveer un subdominio propio más adelante; mientras tanto se usa el subdominio gratuito de Vercel

## Roles

| Rol | Puede |
|---|---|
| **Pastor** | Ver todo (todas las redes, todos los reportes, fotos). Solo lectura. |
| **Admin** | Ver todo, administrar mentores/redes/usuarios/roster de miembros. |
| **Mentor** | Ver los reportes de las redes bajo su mentoría. |
| **Líder** | Crear/editar el reporte semanal de su propia red, gestionar el roster de su red. |

## Qué captura el reporte semanal (por red)

Estas categorías vienen directo del informe de Word original y **deben mantenerse todas** — ninguna se elimina, solo se reorganiza para que sea más fácil de llenar y de leer:

- Total de miembros
- Asistieron (con desglose de fieles/nuevos si el líder lo detalla — ver `CLAUDE.md`)
- Faltaron (se calcula solo, comparando contra el roster de la red)
- Visitas / nuevos
- Discipulados (llamadas, visitas — labor semanal del líder)
- Se congregan (cuántos de la red asistieron al servicio principal)
- Ofrenda
- Material de estudio: libro y capítulo actual
- Comentario del líder (texto libre)
- Fotos de la reunión (máximo 2)

El resumen general de la semana (total de miembros, asistencia total a las redes, total de nuevos, asistencia total a la congregación, total de ofrendas) se calcula automáticamente sumando los reportes de todas las redes — nadie lo vuelve a digitar aparte.

## Próximos pasos

1. Confirmar los últimos puntos técnicos pendientes (dueño del repo/organización, ambiente de pruebas, cuándo llega el subdominio).
2. Crear el proyecto de Supabase y definir el esquema de base de datos (ver `CLAUDE.md`).
3. Scaffoldear el proyecto Next.js real.
4. Migrar el diseño del bosquejo (Artifact) a componentes reales.

Ver `CLAUDE.md` para el detalle técnico completo (modelo de datos, decisiones de producto, sistema de diseño).
