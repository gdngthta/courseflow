import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'CourseFlow',
  description: 'Student productivity app for managing personal and group project tasks',
}

/**
 * CourseFlow is dark-only (Phase 5G). The inline script just stamps
 * the `dark` class on <html> before React hydrates so there's no
 * flash of an un-themed body.
 */
const themeInitScript = `document.documentElement.classList.add('dark');`

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
