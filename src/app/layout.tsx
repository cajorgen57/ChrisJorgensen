import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Personal Tracker",
  description: "Personal finance + fitness tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
