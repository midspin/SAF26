import './globals.css';
import AppLayout from '@/components/AppLayout';

export const metadata = {
  title: 'WEAVE - People. Tasks. Resources. Connected.',
  description: 'WEAVE Platform - People. Tasks. Resources. Connected.',
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
