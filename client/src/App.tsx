import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Profile from "@/pages/profile";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/profile" component={Profile} />
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
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
