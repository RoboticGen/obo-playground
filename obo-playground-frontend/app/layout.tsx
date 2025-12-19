import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import "./globals.css";

const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const redHatText = Red_Hat_Text({
  variable: "--font-red-hat-text",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OBO Playground - Learn Robotics Through Interactive Programming",
  description: "Interactive 3D robot simulation with real-time Python execution. Learn robotics and programming through hands-on experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Havok Physics Engine - automatically loaded via npm package */}
      </head>
      <body
        className={`${redHatDisplay.variable} ${redHatText.variable} font-[family-name:var(--font-red-hat-text)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
