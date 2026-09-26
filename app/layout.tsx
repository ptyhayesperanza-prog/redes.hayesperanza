import type { Metadata } from "next";
import { Fraunces, Work_Sans, IBM_Plex_Mono, Inter, Poppins } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

// Fuentes de los paneles (líder/mentor/pastor/admin) — ver app/dashboard/dashboard.css.
// Se mantienen separadas de Fraunces/Work Sans/IBM Plex Mono, que siguen siendo
// las fuentes del resto de la app (login/registro/home).
const inter = Inter({
  variable: "--font-panel-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-panel-poppins",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Redes Hay Esperanza",
  description: "Panel de reportes semanales de las redes de Hay Esperanza",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${workSans.variable} ${ibmPlexMono.variable} ${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
