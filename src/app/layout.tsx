import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarbonAnalyzer: Personal Carbon Footprint Analyzer",
  description: "Analyze your lifestyle carbon footprint across transport, home energy, food, consumption, and waste. Get AI-powered suggestions and track your eco score to reduce your environmental impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
