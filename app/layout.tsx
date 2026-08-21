import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import PublicPeopleSection from "@/app/components/PublicPeopleSection";
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
          <PublicPeopleSection />
          <PublicPeopleNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
