import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ConciergeOS",
  description: "Back-office premium pour conciergeries",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ConciergeOS",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Splash screen — HTML/CSS pur, affiché avant le JS */}
        <div
          id="splash"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            backgroundColor: "#ffffff",
            transition: "opacity 0.3s ease",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="72" height="72">
            <rect width="64" height="64" rx="14" fill="#000000" />
            <g
              transform="translate(8, 8) scale(2)"
              stroke="white"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              <path d="M10 12h4" />
              <path d="M10 8h4" />
              <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
              <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
              <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
            </g>
          </svg>
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "3px solid #e5e7eb",
              borderTopColor: "#000000",
              borderRadius: "50%",
              animation: "splash-spin 0.8s linear infinite",
            }}
          />
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes splash-spin {
                to { transform: rotate(360deg); }
              }
              #splash.hide {
                opacity: 0;
                pointer-events: none;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function hideSplash() {
                var s = document.getElementById('splash');
                if (s) { s.classList.add('hide'); setTimeout(function() { s.remove(); }, 300); }
              }
              if (document.readyState === 'complete') hideSplash();
              else window.addEventListener('load', hideSplash);
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
