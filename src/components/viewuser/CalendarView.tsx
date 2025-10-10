'use client';
// components\viewuser\CalendarView.tsx
import NotionCalendarView from './NotionCalendarView';

interface CalendarViewProps {
  userId: number;
}

export default function CalendarView({ userId }: CalendarViewProps) {
  return <NotionCalendarView userId={userId} isAdmin={true} />;
}