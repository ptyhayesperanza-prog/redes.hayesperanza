import type { NextConfig } from "next";

// Cabeceras de seguridad básicas para todas las rutas. Vercel ya agrega
// HSTS; estas cubren lo que no viene por defecto:
// - X-Frame-Options: nadie puede meter la app en un <iframe> ajeno para
//   engañar al usuario con clics (clickjacking sobre el login o el admin).
// - nosniff: el navegador no reinterpreta el tipo de un archivo.
// - Referrer-Policy: las URLs internas (ids de reportes) no se filtran a
//   otros sitios al salir de la app.
// - Permissions-Policy: la app no usa cámara, micrófono ni ubicación (las
//   fotos se suben como archivo, no con la cámara en vivo).
const cabecerasSeguridad = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: cabecerasSeguridad }];
  },
};

export default nextConfig;
