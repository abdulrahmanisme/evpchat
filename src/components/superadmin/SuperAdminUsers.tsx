import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Edit, Trash2, Eye, UserPlus, Search, Check, X } from "lucide-react";

interface CampusLead {
  id: string;
  name: string;
  campus_name: string;
  course: string;
  batch: string;
  joined_evp_on: string;
  total_score: number;
  bonus_points: number;
  created_at: string;
  last_submission_date: string | null;
  submissions_count: number;
  verified_submissions: number;
}

export const SuperAdminUsers = () => {
  const [users, setUsers] = useState<CampusLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<CampusLead | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    campus_name: "",
    course: "",
    batch: "",
    total_score: 0,
    bonus_points: 0,
  });
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          reflections!user_id (id, effort_score, quality_score)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithStats = profiles?.map(profile => {
        const reflections = profile.reflections || [];
        return {
          ...profile,
          submissions_count: reflections.length,
          verified_submissions: reflections.filter((r: any) => r.effort_score !== null && r.quality_score !== null).length,
        };
      }) || [];

      setUsers(usersWithStats);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: CampusLead) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      campus_name: user.campus_name,
      course: user.course,
      batch: user.batch,
      total_score: user.total_score,
      bonus_points: user.bonus_points,
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success("User updated successfully!");
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success("User deleted successfully!");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleStartEditName = (user: CampusLead) => {
    setEditingNameId(user.id);
    setEditingName(user.name);
  };

  const handleCancelEditName = () => {
    setEditingNameId(null);
    setEditingName("");
  };

  const handleSaveName = async (userId: string) => {
    if (!editingName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editingName })
        .eq('id', userId);

      if (error) throw error;

      toast.success("Name updated successfully!");
      setEditingNameId(null);
      setEditingName("");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.campus_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campus Leads Management</h2>
          <p className="text-muted-foreground">Manage all campus leads and their data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Campuses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(users.map(u => u.campus_name)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, user) => sum + user.submissions_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, user) => sum + user.verified_submissions, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campus Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {editingNameId === user.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveName(user.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEditName();
                            }
                          }}
                          className="h-8 w-48"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveName(user.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEditName}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEditName(user)}
                        className="hover:underline cursor-pointer"
                      >
                        {user.name}
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.campus_name}</Badge>
                  </TableCell>
                  <TableCell>{user.course}</TableCell>
                  <TableCell>{user.batch}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{user.total_score}</span>
                      {user.bonus_points > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.bonus_points}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{user.submissions_count} total</div>
                      <div className="text-green-600">{user.verified_submissions} verified</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(user.joined_evp_on), 'MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                              Update user information and scores
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                  id="name"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="campus_name">Campus</Label>
                                <Input
                                  id="campus_name"
                                  value={editForm.campus_name}
                                  onChange={(e) => setEditForm({...editForm, campus_name: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="course">Course</Label>
                                <Input
                                  id="course"
                                  value={editForm.course}
                                  onChange={(e) => setEditForm({...editForm, course: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="batch">Batch</Label>
                                <Input
                                  id="batch"
                                  value={editForm.batch}
                                  onChange={(e) => setEditForm({...editForm, batch: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="total_score">Total Score</Label>
                                <Input
                                  id="total_score"
                                  type="number"
                                  value={editForm.total_score}
                                  onChange={(e) => setEditForm({...editForm, total_score: parseInt(e.target.value)})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="bonus_points">Bonus Points</Label>
                                <Input
                                  id="bonus_points"
                                  type="number"
                                  value={editForm.bonus_points}
                                  onChange={(e) => setEditForm({...editForm, bonus_points: parseInt(e.target.value)})}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setEditingUser(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSaveUser}>
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
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
