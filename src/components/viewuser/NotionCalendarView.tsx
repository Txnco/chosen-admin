'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Repeat,
  Trash2,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import { eventApi, EventData, EventCreate, EventUpdate, RepeatType } from '@/lib/api';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  subWeeks, 
  addDays, 
  parseISO, 
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  startOfDay,
  addMinutes as addMins,
} from 'date-fns';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotionCalendarViewProps {
  userId: number;
  isAdmin?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_SLOT_HEIGHT = 80;
const MINUTES_PER_SLOT = 15;

export default function NotionCalendarView({ userId, isAdmin = false }: NotionCalendarViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dragStart, setDragStart] = useState<{ dayIndex: number; minutes: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ dayIndex: number; minutes: number } | null>(null);
  const [draggingEvent, setDraggingEvent] = useState<{ event: EventData; initialDayIndex: number; offsetMinutes: number } | null>(null);
  const [resizingEvent, setResizingEvent] = useState<{ event: EventData; edge: 'top' | 'bottom' } | null>(null);
  
  const [formData, setFormData] = useState<EventCreate>({
    user_id: userId,
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    repeat_type: 'none',
    repeat_until: '',
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEvents();
  }, [currentWeekStart, userId]);

  const convertUTCToLocal = (utcTimeString: string): string => {
    const utcDate = new Date(utcTimeString);
    return utcDate.toISOString();
  };

  const convertLocalToUTC = (localTimeString: string): string => {
    const localDate = new Date(localTimeString);
    return localDate.toISOString();
  };

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const weekStart = currentWeekStart;
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const fetchedEvents = await eventApi.getEventsByDateRange(
        weekStart,
        weekEnd,
        userId,
        true
      );

      const localizedEvents = fetchedEvents.map(event => ({
        ...event,
        start_time: convertUTCToLocal(event.start_time),
        end_time: convertUTCToLocal(event.end_time),
      }));
      
      setEvents(fetchedEvents);
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const minutesToPixels = (minutes: number) => {
    return (minutes / 60) * TIME_SLOT_HEIGHT;
  };

  const pixelsToMinutes = (pixels: number) => {
    const minutes = (pixels / TIME_SLOT_HEIGHT) * 60;
    return Math.round(minutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
  };

  const getEventPosition = (event: EventData) => {
    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);
    
    const startMinutes = getHours(start) * 60 + getMinutes(start);
    const endMinutes = getHours(end) * 60 + getMinutes(end);
    
    const top = minutesToPixels(startMinutes);
    const height = minutesToPixels(endMinutes - startMinutes);
    
    return { top, height };
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const minutes = getHours(now) * 60 + getMinutes(now);
    return minutesToPixels(minutes);
  };

  // FIXED: Calculate minutes from Y position correctly
  const getMinutesFromClick = (e: React.MouseEvent, columnElement: HTMLElement) => {
    const rect = columnElement.getBoundingClientRect();
    const scrollContainer = calendarRef.current;
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    
    // Get Y position relative to the column, accounting for scroll
    const y = e.clientY - rect.top + scrollTop;
    
    // Convert pixels to minutes
    const minutes = pixelsToMinutes(y);
    
    // Clamp to valid range (0-1440 minutes = 24 hours)
    return Math.max(0, Math.min(1440 - MINUTES_PER_SLOT, minutes));
  };

  const handleTimeSlotMouseDown = (dayIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const columnElement = e.currentTarget;
    const minutes = getMinutesFromClick(e, columnElement);
    const snappedMinutes = Math.floor(minutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
    setDragStart({ dayIndex, minutes: snappedMinutes });
    setDragCurrent({ dayIndex, minutes: snappedMinutes + MINUTES_PER_SLOT });
  };

  const handleTimeSlotMouseMove = (dayIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStart || dragStart.dayIndex !== dayIndex) return;
    const columnElement = e.currentTarget;
    const minutes = getMinutesFromClick(e, columnElement);
    const snappedMinutes = Math.floor(minutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
    setDragCurrent({ dayIndex, minutes: Math.max(snappedMinutes, dragStart.minutes + MINUTES_PER_SLOT) });
  };

  const handleTimeSlotMouseUp = () => {
    if (dragStart && dragCurrent) {
      const day = weekDays[dragStart.dayIndex];
      const startTime = addMins(startOfDay(day), dragStart.minutes);
      const endTime = addMins(startOfDay(day), dragCurrent.minutes);
      
      openSidebarForCreate(startTime, endTime);
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  const handleEventMouseDown = (event: EventData, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const dayIndex = weekDays.findIndex(day => isSameDay(parseISO(event.start_time), day));
    if (dayIndex === -1) return;

    const columnElement = e.currentTarget.closest('.day-column') as HTMLElement;
    if (!columnElement) return;

    const clickMinutes = getMinutesFromClick(e, columnElement);
    
    const start = parseISO(event.start_time);
    const startMinutes = getHours(start) * 60 + getMinutes(start);
    
    const offsetMinutes = clickMinutes - startMinutes;
    
    setDraggingEvent({
      event,
      initialDayIndex: dayIndex,
      offsetMinutes: Math.max(0, offsetMinutes),
    });
  };

  const handleEventDrag = (dayIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingEvent) return;
    
    const columnElement = e.currentTarget;
    const minutes = getMinutesFromClick(e, columnElement);
    const snappedMinutes = Math.floor(minutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
    const newStartMinutes = Math.max(0, Math.min(1440 - MINUTES_PER_SLOT, snappedMinutes - draggingEvent.offsetMinutes));
    
    const start = parseISO(draggingEvent.event.start_time);
    const end = parseISO(draggingEvent.event.end_time);
    const duration = (getHours(end) * 60 + getMinutes(end)) - (getHours(start) * 60 + getMinutes(start));
    
    const day = weekDays[dayIndex];
    const newStart = addMins(startOfDay(day), newStartMinutes);
    const newEnd = addMins(newStart, duration);
    
    updateEventTimes(draggingEvent.event.id, newStart, newEnd);
  };

  const handleEventDragEnd = () => {
    if (draggingEvent) {
      saveEventUpdate(draggingEvent.event.id);
    }
    setDraggingEvent(null);
  };

  const handleResizeMouseDown = (event: EventData, edge: 'top' | 'bottom', e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingEvent({ event, edge });
  };

  const handleResizeMove = (dayIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!resizingEvent) return;
    
    const columnElement = e.currentTarget;
    const minutes = getMinutesFromClick(e, columnElement);
    const snappedMinutes = Math.floor(minutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
    const start = parseISO(resizingEvent.event.start_time);
    const end = parseISO(resizingEvent.event.end_time);
    
    if (resizingEvent.edge === 'top') {
      const endMinutes = getHours(end) * 60 + getMinutes(end);
      const newStartMinutes = Math.min(snappedMinutes, endMinutes - MINUTES_PER_SLOT);
      const day = weekDays[dayIndex];
      const newStart = addMins(startOfDay(day), newStartMinutes);
      updateEventTimes(resizingEvent.event.id, newStart, end);
    } else {
      const startMinutes = getHours(start) * 60 + getMinutes(start);
      const newEndMinutes = Math.max(snappedMinutes, startMinutes + MINUTES_PER_SLOT);
      const day = weekDays[dayIndex];
      const newEnd = addMins(startOfDay(day), newEndMinutes);
      updateEventTimes(resizingEvent.event.id, start, newEnd);
    }
  };

  const handleResizeEnd = () => {
    if (resizingEvent) {
      saveEventUpdate(resizingEvent.event.id);
    }
    setResizingEvent(null);
  };

  const updateEventTimes = (eventId: number, newStart: Date, newEnd: Date) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { ...e, start_time: newStart.toISOString(), end_time: newEnd.toISOString() }
        : e
    ));
  };

  const saveEventUpdate = async (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    try {
      await eventApi.update(eventId, {
        start_time: event.start_time,
        end_time: event.end_time,
      });
    } catch (err) {
      console.error('Failed to update event:', err);
      loadEvents();
    }
  };

  const openSidebarForCreate = (startTime: Date, endTime: Date) => {
    setSelectedEvent(null);
    setFormData({
      user_id: userId,
      title: '',
      description: '',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      all_day: false,
      repeat_type: 'none',
      repeat_until: '',
    });
    setIsSidebarOpen(true);
    
    setTimeout(() => {
      document.getElementById('event-title')?.focus();
    }, 100);
  };

  const openSidebarForEdit = (event: EventData) => {
    setSelectedEvent(event);
    setFormData({
      user_id: event.user_id,
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time,
      all_day: event.all_day,
      repeat_type: event.repeat_type,
      repeat_until: event.repeat_until || '',
    });
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedEvent(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }
      
      if (selectedEvent) {
        await eventApi.update(selectedEvent.id, {
          title: formData.title,
          description: formData.description,
          start_time: formData.start_time,
          end_time: formData.end_time,
          all_day: formData.all_day,
          repeat_type: formData.repeat_type,
          repeat_until: formData.repeat_until || undefined,
        });
      } else {
        await eventApi.create(formData);
      }
      
      closeSidebar();
      loadEvents();
    } catch (err: any) {
      console.error('Failed to save event:', err);
      setError(err.response?.data?.detail || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !confirm('Delete this event?')) return;
    
    try {
      await eventApi.delete(selectedEvent.id);
      closeSidebar();
      loadEvents();
    } catch (err: any) {
      setError('Failed to delete event');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) closeSidebar();
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isSidebarOpen) {
        e.preventDefault();
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, formData]);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // FIXED: Format date for datetime-local input (24-hour format)
  const formatDateTimeLocal = (isoString: string): string => {
    if (!isoString) return '';
    const date = parseISO(isoString);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Today
            </Button>
            
            <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <span className="text-lg font-medium ml-4">
              {format(currentWeekStart, 'MMMM yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto" ref={calendarRef}>
        <div className="min-w-full">
          {/* Day Headers */}
          <div className="sticky top-0 z-20 bg-white border-b grid grid-cols-[60px_repeat(7,1fr)]">
            <div className="border-r bg-gray-50" />
            {weekDays.map((day, idx) => (
              <div key={idx} className="p-3 text-center border-r bg-white">
                <div className="text-xs text-gray-500 font-medium uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className={cn(
                  'text-2xl font-bold mt-1',
                  isToday(day) && 'bg-black text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto'
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="relative">
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {/* Time Labels */}
              <div className="border-r bg-gray-50">
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-[80px] border-b text-xs text-gray-600 pr-2 text-right pt-1 font-medium"
                  >
                    {format(setHours(new Date(), hour), 'HH:00')}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="relative border-r day-column"
                  onMouseMove={(e) => {
                    handleTimeSlotMouseMove(dayIndex, e);
                    if (draggingEvent) handleEventDrag(dayIndex, e);
                    if (resizingEvent) handleResizeMove(dayIndex, e);
                  }}
                  onMouseUp={() => {
                    handleTimeSlotMouseUp();
                    handleEventDragEnd();
                    handleResizeEnd();
                  }}
                >
                  {/* Hour Slots */}
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="h-[80px] border-b hover:bg-gray-50 cursor-pointer relative"
                      onMouseDown={(e) => handleTimeSlotMouseDown(dayIndex, e)}
                    >
                      <div className="absolute top-[20px] left-0 right-0 h-px bg-gray-100" />
                      <div className="absolute top-[40px] left-0 right-0 h-px bg-gray-100" />
                      <div className="absolute top-[60px] left-0 right-0 h-px bg-gray-100" />
                    </div>
                  ))}

                  {/* Drag Preview */}
                  {dragStart && dragCurrent && dragStart.dayIndex === dayIndex && (
                    <div
                      className="absolute left-1 right-1 bg-blue-200 border-2 border-blue-500 rounded opacity-50 z-10 pointer-events-none"
                      style={{
                        top: `${minutesToPixels(dragStart.minutes)}px`,
                        height: `${minutesToPixels(dragCurrent.minutes - dragStart.minutes)}px`,
                      }}
                    />
                  )}

                  {/* Events */}
                  {events
                    .filter(event => isSameDay(parseISO(event.start_time), day))
                    .map((event, eventIdx) => {
                      const { top, height } = getEventPosition(event);
                      const isDragging = draggingEvent?.event.id === event.id;
                      
                      return (
                        <div
                          key={`${event.id}-${eventIdx}`}
                          className={cn(
                            'absolute left-1 right-1 rounded-lg p-2 cursor-move hover:shadow-lg transition-shadow z-10 group',
                            event.all_day 
                              ? 'bg-purple-100 border-l-4 border-purple-600' 
                              : 'bg-blue-100 border-l-4 border-blue-600',
                            isDragging && 'opacity-70 shadow-xl scale-105'
                          )}
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 30)}px`,
                          }}
                          onMouseDown={(e) => handleEventMouseDown(event, e)}
                          onClick={(e) => {
                            if (!draggingEvent && !resizingEvent) {
                              e.stopPropagation();
                              openSidebarForEdit(event);
                            }
                          }}
                        >
                          <div
                            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-gray-400/50"
                            onMouseDown={(e) => handleResizeMouseDown(event, 'top', e)}
                          />
                          <div
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-gray-400/50"
                            onMouseDown={(e) => handleResizeMouseDown(event, 'bottom', e)}
                          />
                          
                          <div className="text-sm font-semibold text-black truncate pointer-events-none">
                            {event.title}
                          </div>
                          {height > 40 && event.description && (
                            <div className="text-xs text-gray-600 truncate mt-1 pointer-events-none">
                              {event.description}
                            </div>
                          )}
                          {event.repeat_type !== 'none' && (
                            <Repeat className="w-3 h-3 text-gray-500 absolute top-1 right-1 pointer-events-none" />
                          )}
                        </div>
                      );
                    })}

                  {/* Current Time Indicator */}
                  {isToday(day) && (
                    <div
                      className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none"
                      style={{ top: `${getCurrentTimePosition()}px` }}
                    >
                      <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Editor */}
      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
            onClick={closeSidebar}
          />
          
          <div className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeSidebar}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="event-title">Title *</Label>
                <Input
                  id="event-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                  className="text-lg font-medium"
                />
              </div>

              <DateTimePicker
                  value={formData.start_time}
                  onChange={(isoString) => 
                    setFormData({ ...formData, start_time: isoString })
                  }
                  label="Start Time"
                  disabled={formData.all_day}
                />

                <DateTimePicker
                  value={formData.end_time}
                  onChange={(isoString) => 
                    setFormData({ ...formData, end_time: isoString })
                  }
                  label="End Time"
                  disabled={formData.all_day}
                />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="all-day"
                  checked={formData.all_day}
                  onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="all-day">All-day event</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeat">Repeat</Label>
                <Select 
                  value={formData.repeat_type} 
                  onValueChange={(value: RepeatType) => setFormData({ ...formData, repeat_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Does not repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.repeat_type !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="repeat-until">Repeat until (optional)</Label>
                  <Input
                    id="repeat-until"
                    type="date"
                    value={formData.repeat_until ? format(parseISO(formData.repeat_until), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      repeat_until: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : '' 
                    })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add description..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-black text-white hover:bg-gray-900"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    selectedEvent ? 'Update' : 'Save'
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={closeSidebar}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>

              {selectedEvent && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Event
                </Button>
              )}

              <div className="text-xs text-gray-500 text-center pt-2">
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Esc</kbd> to close
                {' • '}
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Ctrl+S</kbd> to save
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}