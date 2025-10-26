import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'meeting' | 'workshop' | 'event';
  description?: string;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  event_name: string;
  event_date: string;
  attendance_type: string;
  credits_earned: number;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
}

interface OfficeAttendance {
  id?: string;
  user_id: string;
  check_date: string;
  checked_in: boolean;
  created_at?: string;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [officeAttendance, setOfficeAttendance] = useState<OfficeAttendance[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDialogPosition, setEventDialogPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [allowUpdates, setAllowUpdates] = useState<boolean>(true);

  // Sample events data - replace with actual API call
  const sampleEvents: Event[] = [
    {
      id: '1',
      title: 'Campus Lead Meeting',
      date: '2024-01-15',
      time: '10:00 AM',
      location: 'Main Office',
      type: 'meeting',
      description: 'Monthly campus lead coordination meeting to discuss upcoming events and initiatives.'
    },
    {
      id: '2',
      title: 'Workshop: Leadership Skills',
      date: '2024-01-20',
      time: '2:00 PM',
      location: 'Conference Room A',
      type: 'workshop',
      description: 'Interactive workshop focused on developing leadership skills and team management techniques.'
    },
    {
      id: '3',
      title: 'Team Building Event',
      date: '2024-01-25',
      time: '11:00 AM',
      location: 'Outdoor Area',
      type: 'event',
      description: 'Fun team building activities designed to strengthen collaboration and communication among campus leads.'
    }
  ];


  useEffect(() => {
    loadEvents();
    loadAttendance();
    loadOfficeAttendance();
    loadAttendanceSettings();
  }, []);

  const loadAttendanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_settings')
        .select('*')
        .eq('setting_key', 'allow_campus_leads_update')
        .single();

      if (error) {
        // If table doesn't exist yet, default to allowing updates
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.log('Settings table not found, using default (allow updates)');
          setAllowUpdates(true);
        } else {
          throw error;
        }
      } else {
        setAllowUpdates(data?.setting_value ?? true);
      }
    } catch (error) {
      console.error('Error loading attendance settings:', error);
      // Default to allowing updates if there's an error
      setAllowUpdates(true);
    }
  };

  const loadOfficeAttendance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('office_attendance')
        .select('*')
        .eq('user_id', session.user.id)
        .order('check_date', { ascending: true });

      if (error) throw error;
      setOfficeAttendance(data || []);
    } catch (error) {
      console.error('Error loading office attendance:', error);
      setOfficeAttendance([]);
    }
  };

  const toggleOfficeAttendance = async (date: Date, checkedIn: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to mark attendance');
        return;
      }

      // Check if updates are allowed
      if (!allowUpdates) {
        toast.error('Attendance updates are currently disabled. Please contact your admin.');
        return;
      }

      // Prevent marking attendance for future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0);
      
      if (dateToCheck > today) {
        toast.error('Cannot mark attendance for future dates');
        return;
      }

      const checkDate = date.toISOString().split('T')[0];
      
      // Check if attendance already exists
      const existingRecord = officeAttendance.find(
        record => record.check_date === checkDate
      );

      if (existingRecord) {
        // Update existing record - toggle the value
        const { error } = await supabase
          .from('office_attendance')
          .update({ checked_in: !existingRecord.checked_in })
          .eq('id', existingRecord.id);

        if (error) throw error;
        toast.success(existingRecord.checked_in ? 'Marked as absent' : 'Marked as present');
      } else {
        // Create new record - default to present (true)
        const { error } = await supabase
          .from('office_attendance')
          .insert({
            user_id: session.user.id,
            check_date: checkDate,
            checked_in: true
          });

        if (error) throw error;
        toast.success('Marked as present');
      }

      await loadOfficeAttendance();
    } catch (error: any) {
      console.error('Error toggling office attendance:', error);
      toast.error(error.message || 'Failed to update attendance');
    }
  };

  // Track window size for responsive dialog
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close event dialog when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.event-detail-dialog')) {
          closeEventDialog();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to sample events if database fails
      setEvents(sampleEvents);
    }
  };

  const loadAttendance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', session.user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
      setAttendance([]);
    }
  };
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendance.find(record => record.event_date === dateStr);
  };

  const getOfficeAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return officeAttendance.find(record => record.check_date === dateStr);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'workshop':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'event':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleEventClick = (event: Event, clickEvent: React.MouseEvent) => {
    setSelectedEvent(event);
    // Position the dialog at the bottom of the calendar
    const calendarRect = clickEvent.currentTarget.closest('.calendar-grid')?.getBoundingClientRect();
    if (calendarRect) {
      setEventDialogPosition({
        x: calendarRect.left + calendarRect.width / 2,
        y: calendarRect.bottom + 20
      });
    }
  };

  const closeEventDialog = () => {
    setSelectedEvent(null);
  };

  const formatTime = (timeString: string) => {
    // Handle both "14:00:00" and "2:00 PM" formats
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  const markAttendance = async (event: Event, attended: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const eventDate = event.date;
      const existingAttendance = attendance.find(record => 
        record.event_date === eventDate && record.event_name === event.title
      );

      if (existingAttendance) {
        // Update existing attendance record
        const { error } = await supabase
          .from('attendance')
          .update({ 
            credits_earned: attended ? 1 : 0,
            verified_at: attended ? new Date().toISOString() : null
          })
          .eq('id', existingAttendance.id);

        if (error) throw error;
      } else if (attended) {
        // Create new attendance record only if attending
        const { error } = await supabase
          .from('attendance')
          .insert({
            user_id: session.user.id,
            event_name: event.title,
            event_date: eventDate,
            attendance_type: event.type,
            credits_earned: 1,
            verified_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Reload attendance data
      await loadAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };
  const days = getDaysInMonth(currentDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[760px] max-h-[85vh] overflow-y-auto p-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Events Calendar</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {formatDate(currentDate)}
            </h2>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid grid grid-cols-7 gap-0.5">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-1 text-center text-[10px] font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-1" />;
              }

              const dayEvents = getEventsForDate(day);
              const attendanceRecord = getAttendanceForDate(day);
              const officeRecord = getOfficeAttendanceForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const hasAttended = attendanceRecord && attendanceRecord.credits_earned > 0;
              const officeCheckIn = officeRecord?.checked_in || false;
              
              // Check if date is in the past (including today)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const dayDate = new Date(day);
              dayDate.setHours(0, 0, 0, 0);
              const isPastDate = dayDate <= today;
              
              // Show dot only for past dates (not future dates)
              const showOfficeDot = isPastDate;

              return (
                <motion.div
                  key={day.toISOString()}
                  className={`
                    p-1 min-h-[54px] border rounded-lg transition-all duration-200
                    ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                    ${hasAttended ? 'ring-1 ring-green-200 bg-green-50' : ''}
                    hover:shadow-md
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-0.5">
                      <button
                        onClick={() => isPastDate && allowUpdates && toggleOfficeAttendance(day, officeCheckIn)}
                        disabled={!isPastDate || !allowUpdates}
                        className={`text-[10px] font-medium transition-all ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        } ${
                          isPastDate && allowUpdates ? 'cursor-pointer hover:underline' : 'cursor-not-allowed opacity-50'
                        }`}
                        title={
                          !allowUpdates ? 'Attendance updates are disabled by admin' :
                          isPastDate ? 'Click to mark office attendance' : 
                          'Future dates cannot be marked'
                        }
                      >
                        {day.getDate()}
                      </button>
                      <div className="flex items-center gap-1">
                        {/* Office attendance indicator - only show for past dates */}
                        {showOfficeDot && (
                          <button
                            onClick={() => isPastDate && allowUpdates && toggleOfficeAttendance(day, officeCheckIn)}
                            disabled={!isPastDate || !allowUpdates}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              isPastDate && allowUpdates ? 'cursor-pointer hover:scale-125' : 'cursor-not-allowed opacity-50'
                            } ${
                              officeCheckIn ? 'bg-green-500' : 'bg-red-500'
                            }`} 
                            title={
                              !allowUpdates ? 'Updates disabled by admin' :
                              isPastDate ? (officeCheckIn ? 'Went to office - Click to change' : 'Did not go - Click to change') : 
                              'Cannot mark future dates'
                            }
                          />
                        )}
                        {/* Event attendance indicator */}
                        {attendanceRecord && (
                          <div className={`w-1 h-1 rounded-full ${
                            hasAttended ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-0.5">
                      {dayEvents.map(event => (
                        <Badge
                          key={event.id}
                          variant="outline"
                          className={`text-[9px] p-0.5 cursor-pointer hover:shadow-md transition-shadow ${getEventTypeColor(event.type)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event, e);
                          }}
                        >
                          {event.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[10px]">Went to Office</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-[10px]">Did not go</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              <span className="text-[10px]">Attended Event</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-[10px]">Today</span>
            </div>
          </div>

          {/* Event Types Legend */}
          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5">
              Meeting
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-2 py-0.5">
              Workshop
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px] px-2 py-0.5">
              Event
            </Badge>
          </div>
        </div>
        {/* Event Detail Dialog */}
        {selectedEvent && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={closeEventDialog}
            />
            <div
              className="event-detail-dialog fixed z-50 bg-white border border-gray-300 rounded-xl shadow-2xl p-3 sm:p-4 max-w-xs w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-3rem)] mx-auto"
              style={{
                left: isMobile ? '1rem' : '50%',
                top: isMobile ? '50%' : '50%',
                transform: isMobile ? 'translateY(-50%)' : 'translate(-50%, -50%)'
              }}
            >
            <div className="space-y-2 sm:space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${
                    selectedEvent.type === 'meeting' ? 'bg-blue-500' :
                    selectedEvent.type === 'workshop' ? 'bg-purple-500' : 'bg-green-500'
                  }`}></div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">{selectedEvent.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeEventDialog}
                  className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full flex-shrink-0"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              {/* Event Details */}
              <div className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 bg-gray-50 rounded-lg">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Date</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-gray-900 leading-tight">
                        {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 bg-gray-50 rounded-lg">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Time</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-gray-900">{formatTime(selectedEvent.time)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 bg-gray-50 rounded-lg">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Location</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-gray-900 truncate">{selectedEvent.location}</p>
                    </div>
                  </div>
                </div>
                
                {/* Event Type */}
                <div className="flex items-center justify-center">
                  <Badge 
                    variant="outline" 
                    className={`px-2.5 py-1 text-xs font-semibold ${getEventTypeColor(selectedEvent.type)}`}
                  >
                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                  </Badge>
                </div>
                
                {/* Description */}
                {selectedEvent.description && (
                  <div className="pt-2 sm:pt-3 border-t border-gray-200">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">Description</p>
                    <p className="text-[11px] sm:text-xs text-gray-700 leading-relaxed bg-blue-50 p-2 rounded-lg">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Attendance Actions */}
                <div className="pt-2 sm:pt-3 border-t border-gray-200">
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">Mark Attendance</p>
                  <div className="flex flex-col sm:flex-row gap-1.5">
                    <Button
                      onClick={() => markAttendance(selectedEvent, true)}
                      className={`flex-1 h-9 sm:h-8 text-xs ${
                        attendance.find(record => 
                          record.event_date === selectedEvent.date && 
                          record.event_name === selectedEvent.title &&
                          record.credits_earned > 0
                        ) ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                      variant={attendance.find(record => 
                        record.event_date === selectedEvent.date && 
                        record.event_name === selectedEvent.title &&
                        record.credits_earned > 0
                      ) ? 'default' : 'outline'}
                    >
                      ✓ Attended
                    </Button>
                    <Button
                      onClick={() => markAttendance(selectedEvent, false)}
                      variant="outline"
                      className="flex-1 h-9 sm:h-8 text-xs"
                    >
                      ✗ Not Attended
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CalendarModal;
