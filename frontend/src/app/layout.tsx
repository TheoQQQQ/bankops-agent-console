import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BankOps Agent Console",
  description: "AI-assisted customer case review for banking operations",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}
