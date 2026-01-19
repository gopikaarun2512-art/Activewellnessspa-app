import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Active Wellness Admin",
  description: "Admin dashboard for Active Wellness workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
