import "./globals.css";

export const metadata = {
  title: "Nexcord",
  description: "Realtime chat with Next.js and Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
