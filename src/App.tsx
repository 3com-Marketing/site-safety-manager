import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SelectObra from "./pages/SelectObra";
import VisitaActiva from "./pages/VisitaActiva";
import AdminInformeDetalle from "./pages/AdminInformeDetalle";
import AdminClientes from "./pages/AdminClientes";
import AdminObras from "./pages/AdminObras";
import AdminTecnicos from "./pages/AdminTecnicos";
import NotFound from "./pages/NotFound";
import RoleSwitcher from "./components/RoleSwitcher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <RoleSwitcher />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/seleccionar-obra" element={<SelectObra />} />
            <Route path="/visita/:id" element={<VisitaActiva />} />
            <Route path="/admin" element={<Index />} />
            <Route path="/admin/informe/:id" element={<AdminInformeDetalle />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
