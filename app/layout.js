import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/navbar'

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "MAC Blackjack",
  description: "Blackjack game allowing user to play against dealer with AI assistant. Built with Next.js, React, TailwindCSS, and Supabase.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
