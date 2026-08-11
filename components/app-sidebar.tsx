"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  QrCode,
  Newspaper,
  GraduationCap,
  UserCog,
  ShieldCheck,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/components/current-user-provider";

const lmsNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Batches & Classes", url: "/admin/batches", icon: BookOpen },
  { title: "Scanner & Attendance", url: "/admin/scanner", icon: QrCode },
  { title: "Marks & Reports", url: "/admin/marks", icon: GraduationCap },
  { title: "News & Blog", url: "/admin/news", icon: Newspaper },
];

// Admin-only: club membership and staff-account management. Hidden from
// lms_manager sessions here for UX; the API rejects them regardless (auth-guard.ts).
const adminNavItems = [
  { title: "Club Members", url: "/admin/members", icon: UserCog },
  { title: "Staff Accounts", url: "/admin/staff", icon: ShieldCheck },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useCurrentUser();
  const navItems = user?.role === "admin" ? [...lmsNavItems, ...adminNavItems] : lmsNavItems;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Brand header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/admin/dashboard" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-white">
                <Image
                  src="/logo.png"
                  alt="Kallar Central Sports Club crest"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Kallar Central SC</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Admin Portal
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav items */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={pathname.startsWith(item.url)}
                    render={<Link href={item.url} />}
                    // Gold rail marks the active item — a filled gold block at sidebar
                    // width is too much accent area (design-system MASTER.md).
                    className="cursor-pointer border-l-2 border-transparent transition-colors duration-200 data-[active=true]:border-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Logout footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
