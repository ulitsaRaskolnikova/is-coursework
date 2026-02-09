import { Stack } from '@chakra-ui/react';
import React from 'react';
import AppLink from '../../components/AppLink';
import { ArrowRight, MoveRight } from 'lucide-react';
import dayjs from 'dayjs';
import DomainList from '../../components/dashboard/DomainList';
import EventList from '../../components/dashboard/EventList';

const DashboardPage = () => {
  const domains = [
    {
      id: 'e29d0a63-1e74-4d44-b433-59524ecc67ae',
      fqdn: 'hello.example.com',
      expiresAt: dayjs(new Date(2026, 1, 3)),
    },
    {
      id: '25c12320-addf-4a80-bce2-c10aa8be177f',
      fqdn: 'hello.omg.com',
      expiresAt: dayjs(new Date(2026, 2, 6)),
    },
    {
      id: 'e9a0b6d3-a82e-412f-861e-a313c4f3d91b',
      fqdn: 'goodbye.example.com',
      expiresAt: dayjs(new Date(2026, 2, 12)),
    },
  ];

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
    <Stack gap={10}>
      <Stack>
        <AppLink to={'/app/domains'}>
          Мои домены <ArrowRight />{' '}
        </AppLink>
        <DomainList domains={domains} />
      </Stack>

      <Stack>
        <AppLink to={'/app/events'}>
          Мои события <ArrowRight />{' '}
        </AppLink>
        <EventList events={events} />
      </Stack>
    </Stack>
  );
};

export default DashboardPage;
