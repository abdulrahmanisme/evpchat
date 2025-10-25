import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calendar, CheckCircle, XCircle, User, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface CampusLead {
  id: string;
  name: string;
  campus_name: string;
  course: string;
  batch: string;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  attended: boolean;
  notes?: string;
}

export const AdminAttendanceManagement = () => {
  const [campusLeads, setCampusLeads] = useState<CampusLead[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampusLead, setSelectedCampusLead] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    user_id: 'none',
    date: '',
    attended: true,
    notes: ''
  });

  useEffect(() => {
    loadCampusLeads();
    loadAttendanceRecords();
  }, []);

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

  const loadAttendanceRecords = async () => {
    try {
      // For now, using sample data. Replace with actual Supabase query when attendance table is created
      const sampleAttendance: AttendanceRecord[] = [
        {
          id: '1',
          user_id: 'user1',
          date: '2024-01-15',
          attended: true,
          notes: 'On time'
        },
        {
          id: '2',
          user_id: 'user2',
          date: '2024-01-15',
          attended: false,
          notes: 'Sick leave'
        },
        {
          id: '3',
          user_id: 'user1',
          date: '2024-01-16',
          attended: true,
          notes: 'Late by 10 minutes'
        }
      ];
      setAttendanceRecords(sampleAttendance);
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAttendance = () => {
    setAttendanceForm({
      user_id: 'none',
      date: '',
      attended: true,
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveAttendance = async () => {
    try {
      if (!attendanceForm.user_id || attendanceForm.user_id === 'none' || !attendanceForm.date) {
        toast.error('Please fill in all required fields');
        return;
      }

      // For now, just update local state. Replace with actual Supabase operations when attendance table is created
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        ...attendanceForm
      };
      setAttendanceRecords(prev => [...prev, newRecord]);
      toast.success('Attendance record created successfully');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving attendance record:', error);
      toast.error('Failed to save attendance record');
    }
  };

  const handleUpdateAttendance = async (recordId: string, attended: boolean) => {
    try {
      setAttendanceRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { ...record, attended }
          : record
      ));
      toast.success('Attendance updated successfully');
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const getCampusLeadName = (userId: string) => {
    const campusLead = campusLeads.find(lead => lead.id === userId);
    return campusLead ? campusLead.name : 'Unknown';
  };

  const getCampusLeadCampus = (userId: string) => {
    const campusLead = campusLeads.find(lead => lead.id === userId);
    return campusLead ? campusLead.campus_name : 'Unknown';
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const campusLeadName = getCampusLeadName(record.user_id).toLowerCase();
    const campusName = getCampusLeadCampus(record.user_id).toLowerCase();
    const matchesSearch = searchTerm === '' || 
      campusLeadName.includes(searchTerm.toLowerCase()) ||
      campusName.includes(searchTerm.toLowerCase());
    
    const matchesCampusLead = selectedCampusLead === '' || selectedCampusLead === 'all' || record.user_id === selectedCampusLead;
    const matchesDate = selectedDate === '' || record.date === selectedDate;
    
    return matchesSearch && matchesCampusLead && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Attendance Management</h2>
          <p className="text-muted-foreground">Manage campus lead attendance records</p>
        </div>
        <Button onClick={handleCreateAttendance} className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Add Attendance Record
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or campus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Campus Lead</Label>
              <Select value={selectedCampusLead} onValueChange={setSelectedCampusLead}>
                <SelectTrigger>
                  <SelectValue placeholder="All campus leads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All campus leads</SelectItem>
                  {campusLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} ({lead.campus_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Actions</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCampusLead('all');
                  setSelectedDate('');
                  setSearchTerm('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No attendance records found</p>
                <Button onClick={handleCreateAttendance} className="mt-4">
                  Add attendance record
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campus Lead</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {getCampusLeadName(record.user_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCampusLeadCampus(record.user_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={record.attended ? "default" : "destructive"}
                          className={record.attended ? "bg-green-100 text-green-700" : ""}
                        >
                          {record.attended ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />Present</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />Absent</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {record.notes || 'No notes'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateAttendance(record.id, !record.attended)}
                          >
                            {record.attended ? (
                              <><XCircle className="h-4 w-4 mr-1" />Mark Absent</>
                            ) : (
                              <><CheckCircle className="h-4 w-4 mr-1" />Mark Present</>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Attendance Record Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Attendance Record</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campusLead">Campus Lead *</Label>
              <Select
                value={attendanceForm.user_id}
                onValueChange={(value) => setAttendanceForm(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campus lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select campus lead</SelectItem>
                  {campusLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} ({lead.campus_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attended">Status</Label>
              <Select
                value={attendanceForm.attended ? 'present' : 'absent'}
                onValueChange={(value) => setAttendanceForm(prev => ({ 
                  ...prev, 
                  attended: value === 'present' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any notes (optional)"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAttendance}>
                Add Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
