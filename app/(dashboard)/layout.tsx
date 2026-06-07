"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckSquare, Folders, Compass } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import UserMenu from "@/components/user-menu"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="h-screen max-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Global Top Nav adhering to UI System */}
      <header className="h-[64px] shrink-0 bg-card border-b-[2px] border-foreground px-4 sm:px-6 flex items-center justify-between z-50 shadow-[0px_2px_0px_black]">
        <div className="flex items-center gap-8">
          <Link href="/vault" className="font-heading font-extrabold text-[22px] sm:text-[24px] text-foreground tracking-tight hover:opacity-80 transition-opacity">
            MODULUS
          </Link>
        </div>

        <nav className="flex items-center gap-3 sm:gap-6">
          <Link href="/tasks" title="Tasks" aria-label="Tasks" className={`flex items-center gap-1.5 font-sans font-bold text-[14px] transition-colors ${pathname.startsWith('/tasks') ? 'text-[#0A0A0A]' : 'text-[#555550] hover:text-[#0A0A0A]'}`}>
            <CheckSquare className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Tasks</span>
          </Link>
          <Link href="/vault" title="Vault" aria-label="Vault" className={`flex items-center gap-1.5 font-sans font-bold text-[14px] transition-colors ${pathname.startsWith('/vault') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Folders className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Vault</span>
          </Link>
          <Link href="/explore" title="Explore" aria-label="Explore" className={`flex items-center gap-1.5 font-sans font-bold text-[14px] transition-colors ${pathname.startsWith('/explore') ? 'text-[#0A0A0A]' : 'text-[#555550] hover:text-[#0A0A0A]'}`}>
            <Compass className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Explore</span>
          </Link>
          <UserMenu />
        </nav>
      </header>

      {/* Main App Content Pane */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>

      <Toaster
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '2px solid var(--foreground)',
            color: 'var(--card-foreground)',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: '12px',
            fontFamily: 'inherit', // picks up standard sans
          },
        }}
      />
    </div>
  )
}
