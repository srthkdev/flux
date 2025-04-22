import { AppSidebarV2 } from "@/components/app-sidebar-v2"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebarV2 />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 