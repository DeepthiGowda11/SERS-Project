import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Overview from "@/pages/Overview";
import Classrooms from "@/pages/Classrooms";
import ClassroomDetail from "@/pages/ClassroomDetail";
import Students from "@/pages/Students";
import Sessions from "@/pages/Sessions";
import SessionDetail from "@/pages/SessionDetail";
import StudentTrends from "@/pages/StudentTrends";
import Notifications from "@/pages/Notifications";
import Coaching from "@/pages/Coaching";
import ParentPortal from "@/pages/ParentPortal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Parent portal — no sidebar, standalone page */}
      <Route path="/parent/:token" component={ParentPortal} />

      {/* Main app with sidebar layout */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/">
              <Redirect to="/overview" />
            </Route>
            <Route path="/overview" component={Overview} />
            <Route path="/classrooms" component={Classrooms} />
            <Route path="/classrooms/:id" component={ClassroomDetail} />
            <Route path="/classrooms/:id/students" component={Students} />
            <Route path="/classrooms/:id/sessions" component={Sessions} />
            <Route path="/sessions/:id" component={SessionDetail} />
            <Route path="/students/:id/trends" component={StudentTrends} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/coaching" component={Coaching} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
