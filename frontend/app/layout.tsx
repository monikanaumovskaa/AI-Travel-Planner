import "./globals.css";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Navbar from "@/components/Navbar";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "AI Travel Planner",
  description: "Plan your trips with AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} min-h-screen`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}