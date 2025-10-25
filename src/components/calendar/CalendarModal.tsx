import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

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

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
<<<<<<< HEAD
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDialogPosition, setEventDialogPosition] = useState({ x: 0, y: 0 });
=======
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9

  // Sample events data - replace with actual API call
  const sampleEvents: Event[] = [
    {
      id: '1',
      title: 'Campus Lead Meeting',
      date: '2024-01-15',
      time: '10:00 AM',
      location: 'Main Office',
<<<<<<< HEAD
      type: 'meeting',
      description: 'Monthly campus lead coordination meeting to discuss upcoming events and initiatives.'
=======
      type: 'meeting'
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
    },
    {
      id: '2',
      title: 'Workshop: Leadership Skills',
      date: '2024-01-20',
      time: '2:00 PM',
      location: 'Conference Room A',
<<<<<<< HEAD
      type: 'workshop',
      description: 'Interactive workshop focused on developing leadership skills and team management techniques.'
=======
      type: 'workshop'
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
    },
    {
      id: '3',
      title: 'Team Building Event',
      date: '2024-01-25',
      time: '11:00 AM',
      location: 'Outdoor Area',
<<<<<<< HEAD
      type: 'event',
      description: 'Fun team building activities designed to strengthen collaboration and communication among campus leads.'
    }
  ];


  useEffect(() => {
    loadEvents();
    loadAttendance();
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

=======
      type: 'event'
    }
  ];

  // Sample attendance data - replace with actual API call
  const sampleAttendance: AttendanceRecord[] = [
    { date: '2024-01-01', attended: true },
    { date: '2024-01-02', attended: false },
    { date: '2024-01-03', attended: true },
    { date: '2024-01-04', attended: true },
    { date: '2024-01-05', attended: false },
    { date: '2024-01-08', attended: true },
    { date: '2024-01-09', attended: true },
    { date: '2024-01-10', attended: false },
    { date: '2024-01-11', attended: true },
    { date: '2024-01-12', attended: true },
    { date: '2024-01-15', attended: true },
    { date: '2024-01-16', attended: false },
    { date: '2024-01-17', attended: true },
    { date: '2024-01-18', attended: true },
    { date: '2024-01-19', attended: false },
    { date: '2024-01-22', attended: true },
    { date: '2024-01-23', attended: true },
    { date: '2024-01-24', attended: true },
    { date: '2024-01-25', attended: true },
    { date: '2024-01-26', attended: false }
  ];

  useEffect(() => {
    // Load events and attendance data
    setEvents(sampleEvents);
    setAttendance(sampleAttendance);
  }, []);

>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
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
<<<<<<< HEAD
    return attendance.find(record => record.event_date === dateStr);
=======
    return attendance.find(record => record.date === dateStr);
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
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

<<<<<<< HEAD
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

=======
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
  const days = getDaysInMonth(currentDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Events Calendar</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {formatDate(currentDate)}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
<<<<<<< HEAD
          <div className="calendar-grid grid grid-cols-7 gap-1">
=======
          <div className="grid grid-cols-7 gap-1">
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2" />;
              }

              const dayEvents = getEventsForDate(day);
              const attendanceRecord = getAttendanceForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
<<<<<<< HEAD
              const hasAttended = attendanceRecord && attendanceRecord.credits_earned > 0;
=======
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9

              return (
                <motion.div
                  key={day.toISOString()}
                  className={`
                    p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all duration-200
                    ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
<<<<<<< HEAD
                    ${hasAttended ? 'ring-1 ring-green-200 bg-green-50' : ''}
=======
                    ${attendanceRecord?.attended ? 'ring-1 ring-green-200 bg-green-50' : ''}
                    ${attendanceRecord?.attended === false ? 'ring-1 ring-red-200 bg-red-50' : ''}
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
                    hover:shadow-md
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </span>
                      {attendanceRecord && (
                        <div className={`w-2 h-2 rounded-full ${
<<<<<<< HEAD
                          hasAttended ? 'bg-green-500' : 'bg-gray-400'
=======
                          attendanceRecord.attended ? 'bg-green-500' : 'bg-red-500'
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
                        }`} />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      {dayEvents.map(event => (
                        <Badge
                          key={event.id}
                          variant="outline"
<<<<<<< HEAD
                          className={`text-xs p-1 cursor-pointer hover:shadow-md transition-shadow ${getEventTypeColor(event.type)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event, e);
                          }}
=======
                          className={`text-xs p-1 ${getEventTypeColor(event.type)}`}
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
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
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
<<<<<<< HEAD
              <span className="text-sm">Attended Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm">Event Available</span>
=======
              <span className="text-sm">Attended</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Absent</span>
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Today</span>
            </div>
          </div>

          {/* Event Types Legend */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              Meeting
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
              Workshop
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              Event
            </Badge>
          </div>
        </div>
<<<<<<< HEAD

        {/* Event Detail Dialog */}
        {selectedEvent && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={closeEventDialog}
            />
            <div
              className="event-detail-dialog fixed z-50 bg-white border border-gray-300 rounded-xl shadow-2xl p-6 max-w-md mx-auto"
              style={{
                left: `${eventDialogPosition.x}px`,
                top: `${eventDialogPosition.y}px`,
                transform: 'translate(-50%, 0)'
              }}
            >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedEvent.type === 'meeting' ? 'bg-blue-500' :
                    selectedEvent.type === 'workshop' ? 'bg-purple-500' : 'bg-green-500'
                  }`}></div>
                  <h3 className="font-bold text-xl text-gray-900">{selectedEvent.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeEventDialog}
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              {/* Event Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</p>
                      <p className="text-sm font-semibold text-gray-900">{formatTime(selectedEvent.time)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedEvent.location}</p>
                    </div>
                  </div>
                </div>
                
                {/* Event Type */}
                <div className="flex items-center justify-center">
                  <Badge 
                    variant="outline" 
                    className={`px-4 py-2 text-sm font-semibold ${getEventTypeColor(selectedEvent.type)}`}
                  >
                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                  </Badge>
                </div>
                
                {/* Description */}
                {selectedEvent.description && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-3 rounded-lg">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Attendance Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Mark Attendance</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => markAttendance(selectedEvent, true)}
                      className={`flex-1 ${
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
                      className="flex-1"
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
=======
>>>>>>> 87d4941c79fe8876bc9427c0bfc3396c547193f9
      </DialogContent>
    </Dialog>
  );
};

export default CalendarModal;
