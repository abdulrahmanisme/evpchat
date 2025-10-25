import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'meeting' | 'workshop' | 'event';
}

interface AttendanceRecord {
  date: string;
  attended: boolean;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Sample events data - replace with actual API call
  const sampleEvents: Event[] = [
    {
      id: '1',
      title: 'Campus Lead Meeting',
      date: '2024-01-15',
      time: '10:00 AM',
      location: 'Main Office',
      type: 'meeting'
    },
    {
      id: '2',
      title: 'Workshop: Leadership Skills',
      date: '2024-01-20',
      time: '2:00 PM',
      location: 'Conference Room A',
      type: 'workshop'
    },
    {
      id: '3',
      title: 'Team Building Event',
      date: '2024-01-25',
      time: '11:00 AM',
      location: 'Outdoor Area',
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
    return attendance.find(record => record.date === dateStr);
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
          <div className="grid grid-cols-7 gap-1">
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

              return (
                <motion.div
                  key={day.toISOString()}
                  className={`
                    p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all duration-200
                    ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                    ${attendanceRecord?.attended ? 'ring-1 ring-green-200 bg-green-50' : ''}
                    ${attendanceRecord?.attended === false ? 'ring-1 ring-red-200 bg-red-50' : ''}
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
                          attendanceRecord.attended ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      {dayEvents.map(event => (
                        <Badge
                          key={event.id}
                          variant="outline"
                          className={`text-xs p-1 ${getEventTypeColor(event.type)}`}
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
              <span className="text-sm">Attended</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Absent</span>
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
      </DialogContent>
    </Dialog>
  );
};

export default CalendarModal;
