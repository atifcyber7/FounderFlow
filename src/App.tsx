import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import Tasks from '@/pages/Tasks';
import Finance from '@/pages/Finance';
import Notes from '@/pages/Notes';
import Reports from '@/pages/Reports';
import Team from '@/pages/Team';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col">
                        <header className="h-16 flex items-center justify-between border-b border-border/50 px-6 glass-effect sticky top-0 z-10">
                          <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <h2 className="text-xl font-semibold text-gradient">FounderFlow</h2>
                          </div>
                          <ThemeToggle />
                        </header>
                        <main className="flex-1 p-6 overflow-auto">
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/tasks" element={<Tasks />} />
                            <Route path="/finance" element={<Finance />} />
                            <Route path="/notes" element={<Notes />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/team" element={<Team />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;