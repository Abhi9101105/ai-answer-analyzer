import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Answer Grader",
  description:
    "Grade student answers against AI-generated rubrics using semantic similarity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100 font-[var(--font-inter)]">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
