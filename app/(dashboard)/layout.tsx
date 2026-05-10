"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckSquare, Folders, Compass } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import UserMenu from "@/components/user-menu"
import { VaultWindowManager } from "@/components/vault/VaultWindowManager"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="h-screen max-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Global Top Nav adhering to UI System */}
      <header className="h-[64px] shrink-0 bg-card border-b-[2px] border-foreground px-6 flex items-center justify-between z-50 shadow-[0px_2px_0px_black]">
        <div className="flex items-center gap-8">
          <Link href="/vault" className="font-heading font-extrabold text-[24px] text-foreground tracking-tight hover:opacity-80 transition-opacity">
            MODULUS
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          <Link href="/tasks" className={`flex items-center gap-1.5 font-sans font-bold text-[14px] transition-colors ${pathname.startsWith('/tasks') ? 'text-[#0A0A0A]' : 'text-[#555550] hover:text-[#0A0A0A]'}`}>
            <CheckSquare className="w-4 h-4" />
            Tasks
          </Link>
          <Link href="/vault" className={`flex items-center gap-1.5 font-sans font-bold text-[14px] transition-colors ${pathname.startsWith('/vault') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Folders className="w-4 h-4" />
            Vault
          </Link>
          <Link href="/explore" className={`flex items-center gap-1.5 font-sans font-bold text-[14px] transition-colors ${pathname.startsWith('/explore') ? 'text-[#0A0A0A]' : 'text-[#555550] hover:text-[#0A0A0A]'}`}>
            <Compass className="w-4 h-4" />
            Explore
          </Link>
          <UserMenu />
        </nav>
      </header>

      {/* Main App Content Pane */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
        <VaultWindowManager />
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
