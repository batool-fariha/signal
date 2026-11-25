import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WorkspaceProvider } from "@/lib/store";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const description = "Turn feedback noise into product signal. Signal groups support tickets, reviews and interviews into themes and shows the customer words behind every one. Free, open source, runs in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://signal-voc.vercel.app"),
  title: "Signal: customer feedback intelligence",
  description,
  openGraph: { type: "website", siteName: "Signal", title: "Signal: customer feedback intelligence", description, url: "/" },
  twitter: { card: "summary_large_image", title: "Signal: customer feedback intelligence", description },
};

// Applies the saved theme before first paint so dark mode does not flash.
const themeScript = `try{var t=localStorage.getItem("signal.theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
      </body>
    </html>
  );
}
