import "./globals.css";

export const metadata = {
  title: "Toko N·AI·TIVE",
  description: "Toko N·AI·TIVE (Toko Native), AI coaching by The Toko Project LLC",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
