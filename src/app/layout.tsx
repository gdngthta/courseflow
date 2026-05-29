import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'CourseFlow',
  description: 'Student productivity app for managing personal and group project tasks',
}

/**
 * Inline script that runs BEFORE React hydrates. Reads the user's
 * saved theme from localStorage and adds the `dark` class to <html>
 * if needed, so the first paint matches the chosen theme (no flash
 * of wrong-theme content).
 *
 * Kept tiny so it doesn't bloat the document head.
 */
const themeInitScript = `
(function(){try{
  var t = localStorage.getItem('courseflow:theme');
  var dark = (t === 'dark') || (t !== 'light' && (!t || t === 'system') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark || !t) document.documentElement.classList.add('dark');
}catch(e){document.documentElement.classList.add('dark');}})();
`.trim()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
