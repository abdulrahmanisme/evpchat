import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Copy, Check } from "lucide-react";

const AdminUserCreator = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const generateSQL = (userEmail: string) => {
    return `-- Run this SQL in your Supabase SQL Editor to make ${userEmail} an admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = '${userEmail}'
);

-- If the user doesn't exist in user_roles table yet, use this instead:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = '${userEmail}'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin'::app_role;`;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin-login`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        setSuccess(`User created successfully! Email: ${email}`);
        toast.success("User account created! Now run the SQL to make them an admin.");
      }
    } catch (error: any) {
      console.error('User creation error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const sql = generateSQL(email);
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("SQL copied to clipboard!");
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Admin User
        </CardTitle>
        <CardDescription>
          Create a new user account and get the SQL to make them an admin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a secure password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating User..." : "Create User Account"}
          </Button>
        </form>

        {email && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">SQL to Make Admin:</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy SQL"}
              </Button>
            </div>
            <div className="bg-gray-100 p-3 rounded-md">
              <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                {generateSQL(email)}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              After creating the user, run this SQL in your Supabase SQL Editor to grant admin privileges.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminUserCreator;
