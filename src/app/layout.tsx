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

export default function RootFailed to compile.
./src/app/layout.tsx:3:1
Type error: Unused '@ts-expect-error' directive.
  1 | import type { Metadata } from "next";
  2 | import { Inter } from "next/font/google";
> 3 | // @ts-expect-error CSS imports are handled by Next.js
    | ^
  4 | import "./globals.css";
  5 | import { Navbar } from "@/components/navbar";
  6 |
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1Layout({
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
