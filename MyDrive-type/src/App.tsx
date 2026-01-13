import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HeroPage from "./pages/HeroPage";
import OperatePage from "./pages/OperatePage";
import OperateUploadPage from "./pages/OperateUploadPage";
import OperateAccessPage from "./pages/OperateAccessPage";
import ManagePage from "./pages/ManagePage";
import OwnerDashboard from "./pages/OwnerDashboard";
import NotFound from "./pages/NotFound";
import ServerStatusIndicator from "./components/ServerStatusIndicator";
import "./App.css";


const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Background layers (decorative only) */}
      <div className="bg-base" />
      <div className="bg-glow" />
      <div className="bg-blur" />

      <TooltipProvider>
        <Sonner />
        <ServerStatusIndicator></ServerStatusIndicator>

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HeroPage />} />
            <Route path="/operate" element={<OperatePage />} />
            <Route path="/operate/upload" element={<OperateUploadPage />} />
            <Route path="/operate/access" element={<OperateAccessPage />} />
            <Route path="/manage" element={<ManagePage />} />
            <Route path="/owner/:code" element={<OwnerDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;