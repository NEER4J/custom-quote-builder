import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Quote Builder - Create Interactive Quote Forms",
  description: "Easily create beautiful, interactive quote forms for your business",
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-30 w-full border-b glass-effect">
              <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6 md:gap-8">
                  <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <span className="hidden font-bold text-lg sm:inline-block">
                      Quote Builder
                    </span>
                  </Link>
                  <nav className="hidden gap-6 md:flex">
                    <Link href="/protected/dashboard" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground underline-offset-4 hover:underline">
                      Dashboard
                    </Link>
                    <Link href="/protected/form-builder" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground underline-offset-4 hover:underline">
                      Create Form
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center gap-4">
                  <HeaderAuth />
                  <ThemeSwitcher />
                </div>
              </div>
            </header>
            <div className="flex-1 animate-fade-in max-w-7xl mx-auto p-5">
              {children}
            </div>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Quote Builder. All rights reserved.
                </p>
              </div>
            </footer>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
