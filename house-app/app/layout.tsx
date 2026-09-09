import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The House — Böhlen residence',
  description: 'Explore the rooms, floors and architecture of your house.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
