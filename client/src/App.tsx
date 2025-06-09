import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { POSProvider } from "@/hooks/use-pos-store";
import NotFound from "@/pages/not-found";
import POSDashboard from "@/pages/pos-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={POSDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <POSProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </POSProvider>
    </QueryClientProvider>
  );
}

export default App;
