import "./globals.css";
import Providers from "./providers"; // 👈 import the Auth0 wrapper

export const metadata = {
  title: "SummarAIze",
  description: "Summarize notes intelligently",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 min-h-screen">
        <Providers>{children}</Providers> {/* ✅ wrap all pages */}
      </body>
    </html>
  );
}
