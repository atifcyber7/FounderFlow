import { LayoutDashboard, FolderKanban, ListTodo, DollarSign, FileText, BarChart3, LogOut, Sparkles, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth';

export function AppSidebar() {
  const { isAdmin, signOut, user } = useAuth();

  const mainItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Projects', url: '/projects', icon: FolderKanban },
    { title: 'Tasks', url: '/tasks', icon: ListTodo },
    { title: 'Notes', url: '/notes', icon: FileText },
    { title: 'Reports', url: '/reports', icon: BarChart3 },
  ];

  const adminItems = [
    { title: 'Finance', url: '/finance', icon: DollarSign },
    { title: 'Team', url: '/team', icon: Users },
  ];

  return (
    <Sidebar className="border-r border-border/50 glass-effect">
      <SidebarContent>
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gradient">FounderFlow</h2>
              <p className="text-[10px] text-muted-foreground">Management Suite</p>
            </div>
          </div>
        </div>

        <SidebarGroup className="px-4 py-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-3">NAVIGATION</SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {mainItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-l-4 border-primary font-semibold'
                          : 'hover:bg-accent/50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                        <span className="text-sm">{item.title}</span>
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="px-4 py-2">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-3">ADMIN</SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-l-4 border-primary font-semibold'
                            : 'hover:bg-accent/50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                          <span className="text-sm">{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <div className="mt-auto p-4 border-t border-border/50">
          <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Current User</p>
            <p className="text-sm font-medium truncate">{user?.email}</p>
            {isAdmin && (
              <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary">
                Admin
              </span>
            )}
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={signOut} 
                className="text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
