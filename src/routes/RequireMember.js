// RequireMember.jsx
import { useAuth } from '@/contexts/AuthContext';
export default function RequireMember({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}
