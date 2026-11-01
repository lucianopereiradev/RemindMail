import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { useAuth } from "./auth/context.js";
import { GuestOnly, RequireAuth } from "./auth/guards.jsx";
import { AppLayout, SiteLayout } from "./components/layouts.jsx";
import { FullPageSpinner } from "./components/ui.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { ForgotPassword, ResetPassword } from "./pages/PasswordPages.jsx";
import { About, NotFound, Privacy, Terms } from "./pages/InfoPages.jsx";

// O painel só é baixado depois do login (página inicial mais leve)
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Account = lazy(() => import("./pages/Account.jsx"));

// Ao abrir o link de recuperação de senha, leva para a tela de nova senha
function RecoveryRedirect() {
  const { recovering } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (recovering) navigate("/redefinir-senha", { replace: true });
  }, [recovering, navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RecoveryRedirect />
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Landing />} />
              <Route path="sobre" element={<About />} />
              <Route path="termos" element={<Terms />} />
              <Route path="privacidade" element={<Privacy />} />
              <Route
                path="entrar"
                element={
                  <GuestOnly>
                    <Login />
                  </GuestOnly>
                }
              />
              <Route
                path="cadastro"
                element={
                  <GuestOnly>
                    <Register />
                  </GuestOnly>
                }
              />
              <Route path="recuperar-senha" element={<ForgotPassword />} />
              <Route path="redefinir-senha" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route
              path="painel"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="conta" element={<Account />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-sans)" } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
