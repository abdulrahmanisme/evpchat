import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/edventure-park-logo.png";
import { motion } from "framer-motion";

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
    <motion.nav 
      className="border-b border-border bg-background"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link to="/" className="flex items-center gap-3">
            <motion.img 
              src={logo} 
              alt="EdVenture Park" 
              className="h-10"
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.2 }}
            />
            <span className="font-semibold text-lg">Campus Lead Chartbusters</span>
          </Link>
        </motion.div>
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="ghost" asChild>
              <Link to="/leaderboard">Leaderboard</Link>
            </Button>
          </motion.div>
          {user ? (
            <>
              {isSuperAdmin && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" asChild className="text-yellow-600 hover:text-yellow-700">
                    <Link to="/superadmin">Superadmin</Link>
                  </Button>
                </motion.div>
              )}
              {isAdmin && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" asChild>
                    <Link to="/admin">Admin Dashboard</Link>
                  </Button>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </motion.div>
            </>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.nav>
  );
};