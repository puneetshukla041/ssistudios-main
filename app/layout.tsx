// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import ClientRootLayout from './ClientRootLayout';

// Configure the Inter font
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SSI Studios Dashboard',
  description: 'Automated poster creation system for SSI design team',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* ClientRootLayout now supports both Cherry Blossom and Anime video background */}
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  );
}
