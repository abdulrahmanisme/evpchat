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
import SuperAdminUserCreator from "@/components/SuperAdminUserCreator";
import { Crown, Lock, ArrowLeft } from "lucide-react";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is already logged in and has superadmin role
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'superadmin')
          .maybeSingle();
        
        if (data) {
          navigate('/superadmin');
        }
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
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

      // Check if user has superadmin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'superadmin')
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData) {
        // User doesn't have superadmin role, sign them out
        await supabase.auth.signOut();
        throw new Error("Access denied. Superadmin privileges required.");
      }

      toast.success("Superadmin access granted!");
      navigate('/superadmin');
    } catch (error: any) {
      console.error('Superadmin login error:', error);
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

          {/* Superadmin Login Card */}
          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full">
                  <Crown className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Superadmin Access
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Enter your superadmin credentials to access the master control panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-yellow-800">Superadmin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="superadmin@example.com"
                    required
                    className="border-yellow-200 focus:border-yellow-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-yellow-800">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    className="border-yellow-200 focus:border-yellow-400"
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
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white" 
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Access Superadmin Panel"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Superadmin User Creator */}
          <SuperAdminUserCreator />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
