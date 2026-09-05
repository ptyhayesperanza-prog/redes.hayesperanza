# Redes Hay Esperanza — Panel de Reportes Semanales

Aplicación web para reemplazar el informe semanal de Word que usan las redes (grupos pequeños) de la iglesia. Cada líder llena su reporte en un formulario en línea; el resultado se ve como un panel semanal ordenado, exportable a PDF/Excel.

**Estado actual:** esquema de base de datos (con RLS), login/registro, y el formulario de reporte semanal ya están construidos y probados contra el Supabase real, con las 30 redes reales cargadas. Falta el panel de consulta (mentor/pastor/admin) y el despliegue a Vercel — ver `CLAUDE.md` para el detalle técnico completo y el estado exacto.

El bosquejo visual (mockup interactivo, sin datos reales) vive fuera del repo, en un Artifact de Claude. Pídele el link a quien lo generó si necesitas verlo.

## Correr el proyecto localmente

Pasos para que cualquiera pueda bajar este repo y dejarlo corriendo en su máquina.

### 1. Requisitos previos

- **Node.js 20 o superior** (recomendado 22). Sin esto, `npm install` puede fallar o el servidor no arrancar. Para revisar tu versión: `node --version`. Si no tenés Node, instalalo desde [nodejs.org](https://nodejs.org/) o con [nvm](https://github.com/nvm-sh/nvm).
- **Git** instalado (`git --version`).
- **Acceso al proyecto de Supabase real** — pedile a un admin del proyecto las dos credenciales del paso 3 (no son la contraseña de nadie, son claves públicas del proyecto).

### 2. Clonar el repositorio

```bash
git clone https://github.com/ptyhayesperanza-prog/redes.hayesperanza.git
cd redes.hayesperanza
```

### 3. Configurar las variables de entorno

```bash
cp .env.example .env.local
```

Abrí `.env.local` y completá las dos líneas con los valores reales que te pase el admin del proyecto de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://<el-project-ref-real>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<la-clave-real>
```

`.env.local` nunca se sube a git (está en `.gitignore`) — cada persona que corre el proyecto tiene el suyo.

### 4. Instalar dependencias

```bash
npm install
```

Si ves un error `EALLOWSCRIPTS`, tu `~/.npmrc` tiene restringida la ejecución de scripts de instalación; corré `npm install --ignore-scripts` en su lugar.

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

Cuando veas `✓ Ready`, abrí [http://localhost:3000](http://localhost:3000) en el navegador.

### 6. Iniciar sesión

- Si ya tenés una cuenta (líder, mentor, pastor o admin), entrá por `/login`.
- Si no tenés cuenta, creala en `/registro` — queda pendiente de aprobación hasta que un admin te asigne rol y red desde `/admin/usuarios`.

### Nota para Windows

Si el repo vive en una ruta de red o de WSL (por ejemplo `\\wsl.localhost\...`), el watcher de archivos de Next.js puede fallar y reiniciar el servidor en loop. Corré el proyecto directamente dentro de una terminal de WSL (o en una carpeta local normal de Windows) en vez de acceder a la ruta de red desde `cmd`/PowerShell.

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
