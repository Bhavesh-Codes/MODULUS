import { ReactNode } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen max-h-screen bg-[#F5F5F0] flex flex-col overflow-hidden">
      {/* Global Top Nav adhering to UI System */}
      <header className="h-[64px] shrink-0 bg-[#FFFFFF] border-b-[2px] border-[#0A0A0A] px-6 flex items-center justify-between z-50 shadow-[0px_2px_0px_#0A0A0A]">
        <div className="flex items-center gap-8">
          <Link href="/vault" className="font-heading font-extrabold text-[24px] text-[#0A0A0A] tracking-tight hover:opacity-80 transition-opacity">
            MODULUS
          </Link>
          <div className="hidden md:flex relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555550]" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full bg-[#F5F5F0] border-[2px] border-[#0A0A0A] rounded-[8px] py-1.5 pl-10 pr-4 font-mono text-[14px] focus:outline-none focus:bg-[#E8E8E0] transition-colors"
            />
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <Link href="/explore" className="font-sans font-bold text-[14px] text-[#555550] hover:text-[#0A0A0A] transition-colors">
            Explore
          </Link>
          <Link href="/vault" className="font-sans font-bold text-[14px] text-[#555550] hover:text-[#0A0A0A] transition-colors">
            Vault
          </Link>
          <Link href="/setup">
            <button className="w-8 h-8 rounded-full border-[2px] border-[#0A0A0A] bg-[#FFD600] shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-center font-mono font-bold text-[12px] hover:translate-y-px hover:shadow-[1px_1px_0px_#0A0A0A] transition-all">
              ME
            </button>
          </Link>
        </nav>
      </header>

      {/* Main App Content Pane */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>

      <Toaster 
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '2px solid #0A0A0A',
            color: '#0A0A0A',
            boxShadow: '4px 4px 0px #0A0A0A',
            borderRadius: '12px',
            fontFamily: 'inherit', // picks up standard sans
          },
        }}
      />
    </div>
  )
}
