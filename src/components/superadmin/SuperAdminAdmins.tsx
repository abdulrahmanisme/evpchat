import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Crown, UserPlus, Trash2, Shield, Search } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  campus_name: string;
  course: string;
  batch: string;
  role: string;
  created_at: string;
  last_login: string | null;
  submissions_reviewed: number;
}

export const SuperAdminAdmins = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    email: "",
    password: "",
    name: "",
    campus_name: "",
    course: "",
    batch: "",
    role: "admin",
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      // Get all admin users
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          role,
          created_at,
          profiles!user_id (
            id,
            name,
            campus_name,
            course,
            batch,
            created_at
          )
        `)
        .in('role', ['admin', 'superadmin'])
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Get submission review counts for each admin
      const adminIds = adminRoles?.map(role => role.profiles?.id).filter(Boolean) || [];
      const { data: reviewStats } = await supabase
        .from('submissions')
        .select('verified_by')
        .in('verified_by', adminIds);

      const reviewCounts = reviewStats?.reduce((acc: Record<string, number>, submission) => {
        if (submission.verified_by) {
          acc[submission.verified_by] = (acc[submission.verified_by] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      const adminsWithStats = adminRoles?.map(role => ({
        id: role.profiles?.id || '',
        name: role.profiles?.name || 'Unknown',
        campus_name: role.profiles?.campus_name || 'Unknown',
        course: role.profiles?.course || 'Unknown',
        batch: role.profiles?.batch || 'Unknown',
        role: role.role,
        created_at: role.created_at,
        last_login: null, // This would need to be tracked separately
        submissions_reviewed: reviewCounts[role.profiles?.id || ''] || 0,
      })) || [];

      setAdmins(adminsWithStats);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminForm.email,
        password: newAdminForm.password,
        options: {
          data: {
            name: newAdminForm.name,
            campus_name: newAdminForm.campus_name,
            course: newAdminForm.course,
            batch: newAdminForm.batch,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: newAdminForm.name,
            campus_name: newAdminForm.campus_name,
            course: newAdminForm.course,
            batch: newAdminForm.batch,
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // Assign admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: newAdminForm.role as any })
          .eq('user_id', authData.user.id);

        if (roleError) throw roleError;

        toast.success("Admin user created successfully!");
        setShowCreateDialog(false);
        setNewAdminForm({
          email: "",
          password: "",
          name: "",
          campus_name: "",
          course: "",
          batch: "",
          role: "admin",
        });
        loadAdmins();
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast.success("Admin deleted successfully!");
      loadAdmins();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRoleChange = async (adminId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', adminId);

      if (error) throw error;

      toast.success("Role updated successfully!");
      loadAdmins();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.campus_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading admins...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Management</h2>
          <p className="text-muted-foreground">Manage admin users and their permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogDescription>
                  Create a new admin user with full system access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAdminForm.email}
                      onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newAdminForm.password}
                      onChange={(e) => setNewAdminForm({...newAdminForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newAdminForm.name}
                      onChange={(e) => setNewAdminForm({...newAdminForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="campus_name">Campus</Label>
                    <Input
                      id="campus_name"
                      value={newAdminForm.campus_name}
                      onChange={(e) => setNewAdminForm({...newAdminForm, campus_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      value={newAdminForm.course}
                      onChange={(e) => setNewAdminForm({...newAdminForm, course: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="batch">Batch</Label>
                    <Input
                      id="batch"
                      value={newAdminForm.batch}
                      onChange={(e) => setNewAdminForm({...newAdminForm, batch: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newAdminForm.role} onValueChange={(value) => setNewAdminForm({...newAdminForm, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="superadmin">Superadmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAdmin}>
                    Create Admin
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Superadmins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.filter(a => a.role === 'superadmin').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regular Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.filter(a => a.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Admin Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Submissions Reviewed</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{admin.campus_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {admin.role === 'superadmin' ? (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                      <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                        {admin.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{admin.submissions_reviewed}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(admin.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Select
                        value={admin.role}
                        onValueChange={(value) => handleRoleChange(admin.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Superadmin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
