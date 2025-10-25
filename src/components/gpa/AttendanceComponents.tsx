import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, CheckCircle, Clock, Users } from "lucide-react";

interface AttendanceRecord {
  id: string;
  event_name: string;
  event_date: string;
  attendance_type: string;
  credits_earned: number;
  verified_at: string | null;
  created_at: string;
}

interface AttendanceFormProps {
  onSuccess: () => void;
}

export const AttendanceForm = ({ onSuccess }: AttendanceFormProps) => {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [attendanceType, setAttendanceType] = useState("event");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Calculate credits based on attendance type
      const creditsEarned = attendanceType === 'training' ? 5 : 
                           attendanceType === 'workshop' ? 3 : 
                           attendanceType === 'meeting' ? 2 : 1;

      const { error } = await supabase
        .from('attendance')
        .insert([{
          user_id: session.user.id,
          event_name: eventName,
          event_date: eventDate,
          attendance_type: attendanceType,
          credits_earned: creditsEarned
        }]);

      if (error) throw error;

      toast.success("Attendance recorded successfully!");
      setEventName("");
      setEventDate("");
      setAttendanceType("event");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Record Attendance
        </CardTitle>
        <CardDescription>
          Record your attendance at EVP events and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., EVP Campus Meetup, Workshop on Innovation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendanceType">Event Type</Label>
            <Select value={attendanceType} onValueChange={setAttendanceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event (1 credit)</SelectItem>
                <SelectItem value="meeting">Meeting (2 credits)</SelectItem>
                <SelectItem value="workshop">Workshop (3 credits)</SelectItem>
                <SelectItem value="training">Training (5 credits)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Recording..." : "Record Attendance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export const AttendanceList = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendanceRecords();
  }, []);

  const loadAttendanceRecords = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', session.user.id)
        .order('event_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      console.error('Error loading attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (verifiedAt: string | null) => {
    return verifiedAt ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (verifiedAt: string | null) => {
    return verifiedAt ? 
      <Badge variant="default" className="bg-green-500">Verified</Badge> : 
      <Badge variant="secondary">Pending</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'event': 'bg-blue-500',
      'meeting': 'bg-purple-500',
      'workshop': 'bg-orange-500',
      'training': 'bg-green-500'
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-500'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading attendance records...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Attendance History
        </CardTitle>
        <CardDescription>
          Your attendance records and verification status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attendance records found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Credits</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.event_name}</TableCell>
                  <TableCell>{format(new Date(record.event_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getTypeBadge(record.attendance_type)}</TableCell>
                  <TableCell className="text-center font-bold">
                    {record.credits_earned}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(record.verified_at)}
                      {getStatusBadge(record.verified_at)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
