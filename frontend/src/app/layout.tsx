import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./suppressHMRWarnings";
import { ReduxProvider } from "@/components/ReduxProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Batal Sports Academy - Football Academy Management",
  description: "Comprehensive football academy management system for youth athletes aged 4-16. Track skills, assessments, and player development.",
  icons: {
    icon: "/Logo.jpeg",
    apple: "/Logo.jpeg",
  },
  openGraph: {
    title: "Batal Sports Academy",
    description: "Football Academy Management System",
    images: ["/Logo.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
