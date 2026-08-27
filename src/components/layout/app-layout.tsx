import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Sidebar,
  SidebarContent,
} from '@/components/layout/sidebar'
import { SiteHeader } from '@/components/layout/site-header'
import { useAppDispatch, useAppSelector } from '@/store'
import { setSidebarOpen } from '@/store/slices/ui-slice'

export function AppLayout() {
  const { pathname } = useLocation()
  const dispatch = useAppDispatch()
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen)

  useEffect(() => {
    dispatch(setSidebarOpen(false))
  }, [pathname, dispatch])

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />

      <Sheet open={sidebarOpen} onOpenChange={(o) => dispatch(setSidebarOpen(o))}>
        <SheetContent
          side="left"
          className="w-[280px] border-0 p-0 sm:max-w-[280px] rounded-r-[28px] overflow-hidden"
        >
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-dvh flex-col lg:pl-[280px]">
        <SiteHeader pathname={pathname} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
          RouteLink Teller Console · Head Office, Lagos · This is a secure
          environment. All activity is audited.
        </footer>
      </div>
    </div>
  )
}