import { Heading, Stack } from '@chakra-ui/react';
import dayjs from 'dayjs';
import EventList from '~/components/dashboard/EventList';

const EventsPage = () => {
  const events = [
    {
      id: 'e9a0b6d3-a82e-412f-861e-a313c4f3d91b',
      type: 'SYSTEM',
      message: 'Что-то произошло',
      at: dayjs(new Date(2026, 2, 12)),
    },
    {
      id: 'e9a0bvd3-a82e-412f-861e-a313c4f3d91b',
      type: 'USER',
      message: 'Выполнен вход в систему',
      at: dayjs(new Date(2026, 2, 12)),
    },
  ];

  return (
    <Stack gap={4}>
      <Heading>События</Heading>
      <EventList events={events} />
    </Stack>
  );
};

export default EventsPage;
