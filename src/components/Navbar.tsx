import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/edventure-park-logo.png";

export const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) return;
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const adminRole = roles?.find(r => r.role === 'admin');
      const superAdminRole = roles?.find(r => r.role === 'superadmin');
      
      setIsAdmin(!!adminRole);
      setIsSuperAdmin(!!superAdminRole);
    };
    checkRoles();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="EdVenture Park" className="h-10" />
          <span className="font-semibold text-lg">Campus Lead Chartbusters</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isSuperAdmin && (
                <Button variant="ghost" asChild className="text-yellow-600 hover:text-yellow-700">
                  <Link to="/superadmin">Superadmin</Link>
                </Button>
              )}
              {isAdmin && (
                <Button variant="ghost" asChild>
                  <Link to="/admin">Admin Dashboard</Link>
                </Button>
              )}
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="outline" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};