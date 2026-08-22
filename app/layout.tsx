import type { Metadata } from "next";
import "./globals.css";
import "./form-primitives.css";
import "./store-inventory-mobile.css";
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
