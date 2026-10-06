import './globals.css';
import AppLayout from '@/components/AppLayout';
import QueryProvider from '@/components/QueryProvider';

export const metadata = {
  title: 'WEAVE - People. Tasks. Resources. Connected.',
  description: 'WEAVE Platform - People. Tasks. Resources. Connected.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <AppLayout>{children}</AppLayout>
        </QueryProvider>
      </body>
    </html>
  );
}

