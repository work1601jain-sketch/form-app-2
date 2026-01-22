import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, RouteObject, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FormBuilder from "./pages/FormBuilder";
import FormView from "./pages/FormView";
import Submissions from "./pages/Submissions";
import AllSubmissions from "./pages/AllSubmissions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
        {/* Use createBrowserRouter + RouterProvider so we can enable future flags */}
        {/* Enable v7 future flags to opt-in to upcoming behavior changes */}
        {
          (() => {
            const routes: RouteObject[] = [
              { path: '/', element: <Navigate to="/dashboard" replace /> },
              { path: '/auth', element: <Auth /> },
              { path: '/dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
              { path: '/builder/:id', element: <ProtectedRoute><FormBuilder /></ProtectedRoute> },
              { path: '/submissions', element: <ProtectedRoute><AllSubmissions /></ProtectedRoute> },
              { path: '/submissions/:id', element: <ProtectedRoute><Submissions /></ProtectedRoute> },
              { path: '/form/:id', element: <FormView /> },
              { path: '*', element: <NotFound /> },
            ];

            const router = createBrowserRouter([
              {
                element: <AuthProvider><Outlet /></AuthProvider>,
                children: routes,
              }
            ], {
              future: {
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              },
            });

            return <RouterProvider router={router} />;
          })()
        }
      
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;