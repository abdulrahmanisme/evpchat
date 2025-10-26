import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Calendar, User, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CampusLead {
  id: string;
  name: string;
  campus_name: string;
  course: string;
  batch: string;
}

interface OfficeAttendance {
  id: string;
  user_id: string;
  user_name: string;
  campus_name: string;
  check_date: string;
  checked_in: boolean;
  created_at: string;
  updated_at: string;
}

export const AdminOfficeAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [campusLeads, setCampusLeads] = useState<CampusLead[]>([]);
  const [officeAttendance, setOfficeAttendance] = useState<OfficeAttendance[]>([]);
  const [selectedCampusLead, setSelectedCampusLead] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<OfficeAttendance | null>(null);

  useEffect(() => {
    loadCampusLeads();
    loadOfficeAttendance();
  }, [selectedCampusLead, selectedMonth]);

  const loadCampusLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, campus_name, course, batch')
        .order('name');

      if (error) throw error;
      setCampusLeads(data || []);
    } catch (error) {
      console.error('Error loading campus leads:', error);
      toast.error('Failed to load campus leads');
    }
  };

  const loadOfficeAttendance = async () => {
    try {
      setLoading(true);
      
      // Calculate the last day of the selected month
      const [year, month] = selectedMonth.split('-');
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;
      
      let query = supabase
        .from('office_attendance')
        .select(`
          *,
          profiles!user_id (
            name,
            campus_name
          )
        `)
        .gte('check_date', `${selectedMonth}-01`)
        .lte('check_date', endDate)
        .order('check_date', { ascending: false });

      if (selectedCampusLead !== 'all') {
        query = query.eq('user_id', selectedCampusLead);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = (data || []).map((record: any) => ({
        id: record.id,
        user_id: record.user_id,
        user_name: record.profiles?.name || 'Unknown',
        campus_name: record.profiles?.campus_name || 'Unknown',
        check_date: record.check_date,
        checked_in: record.checked_in,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));

      setOfficeAttendance(formattedData);
    } catch (error) {
      console.error('Error loading office attendance:', error);
      toast.error('Failed to load office attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (record: OfficeAttendance) => {
    try {
      const { error } = await supabase
        .from('office_attendance')
        .update({ checked_in: !record.checked_in })
        .eq('id', record.id);

      if (error) throw error;

      toast.success('Attendance updated successfully');
      loadOfficeAttendance();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const handleEditClick = (record: OfficeAttendance) => {
    setEditingAttendance(record);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAttendance) return;

    try {
      const { error } = await supabase
        .from('office_attendance')
        .update({ checked_in: editingAttendance.checked_in })
        .eq('id', editingAttendance.id);

      if (error) throw error;

      toast.success('Attendance updated successfully');
      setIsEditDialogOpen(false);
      setEditingAttendance(null);
      loadOfficeAttendance();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const filteredAttendance = officeAttendance.filter(record =>
    record.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.campus_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const attendanceStats = officeAttendance.reduce((acc, record) => {
    if (record.checked_in) {
      acc.present++;
    } else {
      acc.absent++;
    }
    return acc;
  }, { present: 0, absent: 0 });

  const attendanceRate = officeAttendance.length > 0
    ? ((attendanceStats.present / officeAttendance.length) * 100).toFixed(1)
    : '0';

  if (loading) {
    return <div className="text-center py-8">Loading office attendance...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Office Attendance Management</h2>
          <p className="text-muted-foreground">Manage campus lead office check-in records</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{officeAttendance.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="campus-lead">Campus Lead</Label>
              <Select value={selectedCampusLead} onValueChange={setSelectedCampusLead}>
                <SelectTrigger id="campus-lead">
                  <SelectValue placeholder="Select campus lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campus Leads</SelectItem>
                  {campusLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.campus_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or campus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Office Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Campus Lead</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.check_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{record.user_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.campus_name}</Badge>
                    </TableCell>
                    <TableCell>
                      {record.checked_in ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Present
                        </Badge>
                      ) : (
                        <Badge className="bg-red-600 hover:bg-red-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          Absent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAttendance(record)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Toggle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Office Attendance</DialogTitle>
          </DialogHeader>
          {editingAttendance && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Campus Lead: <strong>{editingAttendance.user_name}</strong>
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Date: <strong>{new Date(editingAttendance.check_date).toLocaleDateString()}</strong>
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editingAttendance.checked_in.toString()}
                  onValueChange={(value) =>
                    setEditingAttendance({ ...editingAttendance, checked_in: value === 'true' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Present</SelectItem>
                    <SelectItem value="false">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

