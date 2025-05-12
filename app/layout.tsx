import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Plus_Jakarta_Sans } from "next/font/google";
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

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakartaSans.variable} font-sans`} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />
          <main className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-30 w-full border-b glass-effect">
              <div className="container flex h-16 items-center justify-between py-2">
                <div className="flex items-center gap-6 md:gap-8">
                  <Link href="/" className="flex items-center space-x-2.5 transition-opacity hover:opacity-90">
                    <div className="relative w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 animate-pulse-soft">
                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z"/>
                        <line x1="16" y1="8" x2="2" y2="22"/>
                        <line x1="17.5" y1="15" x2="9" y2="15"/>
                      </svg>
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-background border-2 border-accent rounded-full"></span>
                    </div>
                    <span className="hidden font-bold text-lg tracking-tight sm:inline-block">
                      Quote<span className="text-accent">Builder</span>
                    </span>
                  </Link>
                  <nav className="hidden gap-6 md:flex">
                    <Link href="/protected/dashboard" className="group flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      <span>Dashboard</span>
                      <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-0.5 bg-accent mt-0.5"></span>
                    </Link>
                    <Link href="/protected/form-builder" className="group flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      <span>Create Form</span>
                      <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-0.5 bg-accent mt-0.5"></span>
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center gap-4">
                  <HeaderAuth />
                  <ThemeSwitcher />
                </div>
              </div>
            </header>
            <div className="flex-1 animate-fade-in mx-auto w-full max-w-[2000px] p-4 sm:p-6 md:p-8">
              {children}
            </div>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} <span className="text-accent">Quote</span>Builder. All rights reserved.
                </p>
                <div className="flex items-center space-x-4">
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms
                  </Link>
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </div>
              </div>
            </footer>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
