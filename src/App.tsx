
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import ScriptGenerator from "./pages/ScriptGenerator";
import ImageGenerator from "./pages/ImageGenerator";
import VoiceGenerator from "./pages/VoiceGenerator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <Layout>
                <ScriptGenerator />
              </Layout>
            } 
          />
          <Route 
            path="/image-generator" 
            element={
              <Layout>
                <ImageGenerator />
              </Layout>
            } 
          />
          <Route 
            path="/voice-generator" 
            element={
              <Layout>
                <VoiceGenerator />
              </Layout>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
