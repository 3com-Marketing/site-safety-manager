import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import AdminInformes from "./pages/AdminInformes";
import Login from "./pages/Login";
import SelectObra from "./pages/SelectObra";
import VisitaActiva from "./pages/VisitaActiva";
import AdminInformeDetalle from "./pages/AdminInformeDetalle";
import AdminClientes from "./pages/AdminClientes";
import AdminObras from "./pages/AdminObras";
import AdminTecnicos from "./pages/AdminTecnicos";
import NotFound from "./pages/NotFound";
import AdminVisitaDetalle from "./pages/AdminVisitaDetalle";
import AdminDocumentos from "./pages/AdminDocumentos";
import AdminDocumentoDetalle from "./pages/AdminDocumentoDetalle";
import AdminDocumentoPreview from "./pages/AdminDocumentoPreview";
import TechDocumentos from "./pages/TechDocumentos";
import TechDocumentoDetalle from "./pages/TechDocumentoDetalle";
import AdminConfiguracion from "./pages/AdminConfiguracion";
import AdminCalendario from "./pages/AdminCalendario";
import AdminSenales from "./pages/AdminSenales";
import RoleSwitcher from "./components/RoleSwitcher";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
          <RoleSwitcher />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/seleccionar-obra" element={<SelectObra />} />
            <Route path="/visita/:id" element={<VisitaActiva />} />
            <Route path="/admin" element={<AdminInformes />} />
            <Route path="/admin/informe/:id" element={<AdminInformeDetalle />} />
            <Route path="/admin/clientes" element={<AdminClientes />} />
            <Route path="/admin/obras" element={<AdminObras />} />
            <Route path="/admin/tecnicos" element={<AdminTecnicos />} />
            <Route path="/admin/visita/:id" element={<AdminVisitaDetalle />} />
            <Route path="/admin/documentos" element={<AdminDocumentos />} />
            <Route path="/admin/documento/:id" element={<AdminDocumentoDetalle />} />
            <Route path="/admin/documento/:id/preview" element={<AdminDocumentoPreview />} />
            <Route path="/documentos" element={<TechDocumentos />} />
            <Route path="/documento/:id" element={<TechDocumentoDetalle />} />
            <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
            <Route path="/admin/calendario" element={<AdminCalendario />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
