import { Heading, Stack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import EventList from '~/components/dashboard/EventList';
import Axios from 'axios';
import { getAccessToken } from '~/utils/authTokens';

interface AuditEventDto {
  id: number;
  description: string;
  eventTime: string;
}

const EventsPage = () => {
  const [events, setEvents] = useState<
    { id: string; type: 'SYSTEM' | 'USER'; message: string; at: string }[]
  >([]);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const token = getAccessToken();
        const { data } = await Axios.get<AuditEventDto[]>(
          '/api/audit/events/my',
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (isMounted) {
          setEvents(
            (data ?? []).map((e) => ({
              id: e.id.toString(),
              type: 'SYSTEM' as const,
              message: e.description,
              at: e.eventTime,
            }))
          );
        }
      } catch {
        if (isMounted) setEvents([]);
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Stack gap={4}>
      <Heading>События</Heading>
      <EventList events={events} />
    </Stack>
  );
};

export default EventsPage;
