import { redirect } from "next/navigation";

// El formulario real vive ahora en /lider/informes/nuevo, dentro del
// panel con sidebar. Esta ruta se conserva solo como alias por si queda
// algún link viejo.
export default function ReportarRedirectPage() {
  redirect("/lider/informes/nuevo");
}
