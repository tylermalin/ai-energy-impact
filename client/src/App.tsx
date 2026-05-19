import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";

const SensorsDemo = lazy(() => import("./pages/SensorsDemo"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminPending = lazy(() => import("./pages/AdminPending"));
const AdminIngestion = lazy(() => import("./pages/AdminIngestion"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/About"));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-mono text-sm">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/sensors"}>
        <Suspense fallback={<LoadingFallback />}>
          <SensorsDemo />
        </Suspense>
      </Route>
      <Route path={"/blog"}>
        <Suspense fallback={<LoadingFallback />}>
          <Blog />
        </Suspense>
      </Route>
      <Route path={"/blog/:slug"}>
        <Suspense fallback={<LoadingFallback />}>
          <BlogPost />
        </Suspense>
      </Route>
      <Route path={"/about"}>
        <Suspense fallback={<LoadingFallback />}>
          <About />
        </Suspense>
      </Route>
      <Route path={"/admin"}>
        <Suspense fallback={<LoadingFallback />}>
          <Admin />
        </Suspense>
      </Route>
      <Route path={"/admin/pending"}>
        <Suspense fallback={<LoadingFallback />}>
          <AdminPending />
        </Suspense>
      </Route>
      <Route path={"/admin/ingestion"}>
        <Suspense fallback={<LoadingFallback />}>
          <AdminIngestion />
        </Suspense>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
