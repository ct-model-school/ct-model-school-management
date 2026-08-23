import type { Metadata } from "next";
import "./globals.css";
import "./form-primitives.css";
import "./store-inventory-mobile.css";
import "./mobile-responsive.css";
import "./hero-fix.css";
import "./contact-enhancements.css";
import "./community-mobile.css";
import "./community-card.css";
import "./footer-header-fix.css";
import "./desktop-theme.css";
import { ThemeProvider } from "@/context/ThemeContext";
import PublicPeopleNav from "@/app/components/PublicPeopleNav";

export const metadata: Metadata = {
  title: "C.T. Model School",
  description: "C.T. Model School Digital Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <PublicPeopleNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
