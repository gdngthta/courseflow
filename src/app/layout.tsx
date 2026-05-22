import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CourseFlow',
  description: 'Student productivity app for managing personal and group project tasks',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
