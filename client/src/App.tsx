import { Switch, Route } from "wouter";
// import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
// import NotFound from "@/pages/not-found";
// import Home from "@/pages/home";
// import Profile from "@/pages/profile";
// import { AuthProvider } from "./components/auth/useAuth";
// import { ThemeProvider } from "./components/theme/ThemeProvider";
// import Header from "./components/layout/Header";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      
    </QueryClientProvider>
  );
}

export default App;
