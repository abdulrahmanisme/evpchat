import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings, Database, Trash2, Download, Upload, AlertTriangle, CheckCircle } from "lucide-react";

interface SystemInfo {
  totalUsers: number;
  totalSubmissions: number;
  totalAdmins: number;
  databaseSize: string;
  lastBackup: string | null;
}

export const SuperAdminSystem = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    totalUsers: 0,
    totalSubmissions: 0,
    totalAdmins: 0,
    databaseSize: "Unknown",
    lastBackup: null,
  });
  const [loading, setLoading] = useState(true);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [showDangerDialog, setShowDangerDialog] = useState(false);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const [profilesResult, submissionsResult, rolesResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
      ]);

      setSystemInfo({
        totalUsers: profilesResult.count || 0,
        totalSubmissions: submissionsResult.count || 0,
        totalAdmins: rolesResult.count || 0,
        databaseSize: "Unknown", // This would need a custom function
        lastBackup: null, // This would need backup tracking
      });
    } catch (error) {
      console.error('Error loading system info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || !bulkInput) {
      toast.error("Please select an action and provide input");
      return;
    }

    try {
      switch (bulkAction) {
        case "reset_scores":
          const userIds = bulkInput.split(',').map(id => id.trim());
          const { error: resetError } = await supabase
            .from('profiles')
            .update({ total_score: 0, bonus_points: 0 })
            .in('id', userIds);
          
          if (resetError) throw resetError;
          toast.success("Scores reset successfully!");
          break;

        case "delete_users":
          const deleteIds = bulkInput.split(',').map(id => id.trim());
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .in('id', deleteIds);
          
          if (deleteError) throw deleteError;
          toast.success("Users deleted successfully!");
          break;

        case "bulk_verify":
          const submissionIds = bulkInput.split(',').map(id => id.trim());
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("Not authenticated");

          const { error: verifyError } = await supabase
            .from('submissions')
            .update({
              status: 'verified',
              verified_at: new Date().toISOString(),
              verified_by: session.user.id,
            })
            .in('id', submissionIds);
          
          if (verifyError) throw verifyError;
          toast.success("Submissions verified successfully!");
          break;

        default:
          toast.error("Invalid action selected");
      }

      setBulkInput("");
      loadSystemInfo();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSystemReset = async () => {
    if (!confirm("Are you sure you want to reset the entire system? This will delete ALL data and cannot be undone!")) {
      return;
    }

    try {
      // Delete all submissions
      await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Delete all user roles
      await supabase.from('user_roles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Delete all profiles
      await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast.success("System reset completed!");
      loadSystemInfo();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const exportData = async () => {
    try {
      const [profiles, submissions, roles] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('submissions').select('*'),
        supabase.from('user_roles').select('*'),
      ]);

      const exportData = {
        profiles: profiles.data,
        submissions: submissions.data,
        roles: roles.data,
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evp-campus-champions-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading system information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">System Administration</h2>
        <p className="text-muted-foreground">Manage system-wide settings and perform bulk operations</p>
      </div>

      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo.totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo.totalAdmins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo.databaseSize}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export all system data as a JSON backup file
            </p>
            <Button onClick={exportData} className="w-full">
              Export All Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bulk Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bulk-action">Action</Label>
              <select
                id="bulk-action"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">Select an action</option>
                <option value="reset_scores">Reset User Scores</option>
                <option value="bulk_verify">Bulk Verify Submissions</option>
                <option value="delete_users">Delete Users</option>
              </select>
            </div>
            <div>
              <Label htmlFor="bulk-input">
                {bulkAction === "reset_scores" && "User IDs (comma-separated)"}
                {bulkAction === "bulk_verify" && "Submission IDs (comma-separated)"}
                {bulkAction === "delete_users" && "User IDs (comma-separated)"}
                {!bulkAction && "Input"}
              </Label>
              <Textarea
                id="bulk-input"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Enter IDs separated by commas"
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleBulkAction} 
              disabled={!bulkAction || !bulkInput}
              className="w-full"
            >
              Execute Bulk Action
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These actions are irreversible and will permanently delete data from the system.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <p className="text-sm text-red-700">
              <strong>System Reset:</strong> This will delete ALL users, submissions, and data from the system.
            </p>
            <Dialog open={showDangerDialog} onOpenChange={setShowDangerDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Entire System
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600">Confirm System Reset</DialogTitle>
                  <DialogDescription>
                    This action will permanently delete ALL data from the system including:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All user profiles</li>
                      <li>All submissions</li>
                      <li>All admin roles</li>
                      <li>All uploaded files</li>
                    </ul>
                    <strong className="text-red-600">This cannot be undone!</strong>
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDangerDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleSystemReset}>
                    Yes, Reset Everything
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
