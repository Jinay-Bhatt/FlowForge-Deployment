import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FlowForge — Visual Backend API Builder & Workflow Compiler',
  description: 'Design, test, and monitor backend workflows visually. Compile and export standard Fastify/TypeScript codebases with zero vendor lock-in.',
  keywords: ['visual api builder', 'no-code backend', 'workflow compiler', 'Fastify generator', 'FlowForge', 'visual logic canvas'],
  authors: [{ name: 'FlowForge Core Team' }],
  openGraph: {
    title: 'FlowForge — Visual Backend API Builder & Workflow Compiler',
    description: 'Design and deploy backend APIs visually. Compile nodes directly into production-grade TypeScript Fastify apps.',
    url: 'https://flowforge.dev',
    siteName: 'FlowForge Platform',
    images: [
      {
        url: '/FlowForge.png',
        width: 800,
        height: 800,
        alt: 'FlowForge visual builder preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowForge — Visual Backend API Builder & Workflow Compiler',
    description: 'Design and deploy backend APIs visually. Compile nodes directly into production-grade TypeScript Fastify apps.',
    images: ['/FlowForge.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
  icons: {
    icon: '/FlowForge.png',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/FlowForge.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
