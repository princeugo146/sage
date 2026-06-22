import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'SAGE - AI Companion Platform',
  description: 'Advanced AI companion with memory, emotion detection, and realistic avatars',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
