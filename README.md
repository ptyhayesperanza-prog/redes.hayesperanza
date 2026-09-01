# Redes Hay Esperanza — Panel de Reportes Semanales

Aplicación web para reemplazar el informe semanal de Word que usan las redes (grupos pequeños) de la iglesia. Cada líder llena su reporte en un formulario en línea; el resultado se ve como un panel semanal ordenado, exportable a PDF/Excel.

**Estado actual: scaffold funcionando.** El esquema de base de datos (con RLS) ya está aplicado en el proyecto real de Supabase, y el proyecto Next.js está conectado y corriendo. Faltan las pantallas reales (login, formulario de reporte, panel de consulta) — ver `CLAUDE.md` para el detalle técnico completo y el estado exacto.

El bosquejo visual (mockup interactivo, sin datos reales) vive fuera del repo, en un Artifact de Claude. Pídele el link a quien lo generó si necesitas verlo.

## Correr el proyecto localmente

```bash
npm install
cp .env.example .env.local   # pedir las credenciales reales del proyecto Supabase
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

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

1. ~~Confirmar los últimos puntos técnicos pendientes~~ — dueño del repo, ambientes y permisos de roster ya resueltos (ver `CLAUDE.md`). Queda pendiente solo el dominio final y quién hace la carga inicial de datos.
2. ~~Definir el esquema de base de datos~~ — ver [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. ~~Crear el proyecto real de Supabase y aplicar esta migración~~ — proyecto `redes-hayesperanza` activo, esquema y RLS aplicados y verificados (sin advertencias de seguridad/rendimiento).
4. ~~Scaffoldear el proyecto Next.js real y conectarlo a Supabase~~ — hecho, corriendo y probado contra el Supabase real (ver `CLAUDE.md`).
5. ~~Construir el login y el formulario de reporte semanal~~ — hecho y probado de punta a punta (login, formulario, fotos). Ver `CLAUDE.md` para credenciales de prueba y huecos pendientes.
6. Migrar el diseño del bosquejo (Artifact) a componentes reales.
7. Cargar el catálogo real de `materiales`/`temas_material` (hoy está vacío).
8. Construir el panel de consulta (mentor/pastor/admin).
9. Desplegar a Vercel — necesario para que el correo de restablecimiento de contraseña del admin funcione.

Ver `CLAUDE.md` para el detalle técnico completo (modelo de datos, decisiones de producto, sistema de diseño).
