
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, User, ScanSearch, ChefHat, Refrigerator, ClipboardList, MessageSquare, LogOut, Utensils, LogIn, UserPlus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItemsUnauthenticated = [
  { href: "/", label: "Painel", icon: Home },
  { href: "/login", label: "Login", icon: LogIn },
  { href: "/register", label: "Registrar", icon: UserPlus },
];

const navItemsAuthenticated = [
  { href: "/", label: "Painel", icon: Home },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/analyze-meal", label: "Analisar Refeição", icon: ClipboardList }, // Changed icon from Camera to ClipboardList
  { href: "/fridge-recipe", label: "Receita da Geladeira", icon: Refrigerator },
  { href: "/generate-recipe", label: "Obter Receitas", icon: ChefHat },
  { href: "/classify-food", label: "Classificar Alimento", icon: ScanSearch },
  { href: "/chat", label: "Chat de Nutrição", icon: MessageSquare },
  { href: "/shopping-list-planner", label: "Planejador de Compras", icon: ShoppingCart },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile } = useSidebar();
  const { currentUser, logout, isLoading } = useAuth();

  const navItems = isLoading ? [] : currentUser ? navItemsAuthenticated : navItemsUnauthenticated;

  return (
    <Sidebar side="left" collapsible={isMobile ? "offcanvas" : "icon"} variant="sidebar">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Utensils className="w-8 h-8 text-primary" />
          <h1 className={cn(
            "font-bold text-xl font-headline text-primary transition-opacity duration-300",
            (open || !isMobile) && (isMobile || open) ? "opacity-100" : "opacity-0 md:opacity-100",
             isMobile && !open ? "opacity-0" : "",
             !isMobile && !open && "opacity-0",
             !isMobile && open && "opacity-100"
          )}>
            Assistente Nutricional
          </h1>
        </Link>
        <SidebarTrigger className="md:hidden" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  onClick={() => isMobile && setOpen(false)}
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, className: "font-body"}}
                  className="font-body"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {!isLoading && currentUser && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} tooltip={{ children: "Sair", className: "font-body" }} className="font-body w-full">
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
