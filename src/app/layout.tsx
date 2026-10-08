import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { DataProvider } from "@/components/DataProvider";

export const metadata: Metadata = {
  title: "PulseBoard — SaaS analytics dashboard",
  description: "Revenue, customers and churn for a SaaS business, in one fast dashboard.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#2a78d6" };

const themeScript = `try{var d=document.documentElement;if(!d.dataset.theme){d.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("theme")?.value;
  return (
    <html lang="en" data-theme={theme === "dark" || theme === "light" ? theme : undefined} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <DataProvider>
          <Shell>{children}</Shell>
        </DataProvider>
      </body>
    </html>
  );
}
