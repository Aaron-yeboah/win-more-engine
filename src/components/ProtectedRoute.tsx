import { Navigate, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Props = { children: React.ReactNode; admin?: boolean };

export default function ProtectedRoute({ children, admin = false }: Props) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center bg-background"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/access" state={{ from: location.pathname }} replace />;
  if (admin && !isAdmin) return <Navigate to="/vip" replace />;
  return <>{children}</>;
}
