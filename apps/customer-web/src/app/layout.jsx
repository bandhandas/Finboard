import { AppProviders } from "@/providers";
import "./globals.css";
import { Inter, Manrope } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"]
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"]
});

export const metadata = {
  title: "Finboard — KYC, Banking & Investments",
  description: "Investor onboarding, identity verification, and demo investment platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, manrope.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
