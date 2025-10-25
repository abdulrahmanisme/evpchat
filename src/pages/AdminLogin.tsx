import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import AdminUserCreator from "@/components/AdminUserCreator";
import { Shield, Lock, ArrowLeft } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is already logged in and has admin role
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (data) {
          navigate('/admin');
        }
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData) {
        // User doesn't have admin role, sign them out
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      toast.success("Admin access granted!");
      navigate('/admin');
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={handleBackToMain}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Main Site
          </Button>

          {/* Admin Login Card */}
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-800">Admin Access</CardTitle>
              <CardDescription className="text-red-700">
                Enter your admin credentials to access the control panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-red-800">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-red-800">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <Lock className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white" 
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Access Admin Panel"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Admin User Creator */}
          <AdminUserCreator />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
