import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Prosody — AI Speech & Social Skills Trainer",
  description:
    "Train your speaking confidence with AI-powered delivery analysis. Practice impromptu speeches, debates, interviews, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased min-h-screen`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
