import './globals.css';
import AppLayout from '@/components/AppLayout';

export const metadata = {
  title: 'ORBITA - connecting people, tasks and resources',
  description: 'ORBITA Platform - connecting people, tasks and resources',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
