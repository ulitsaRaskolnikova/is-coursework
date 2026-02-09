import { Stack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import AppLink from '../../components/AppLink';
import { ArrowRight } from 'lucide-react';
import DomainList from '../../components/dashboard/DomainList';
import EventList from '../../components/dashboard/EventList';
import { AXIOS_INSTANCE } from '~/api/apiClientDomains';
import type { DomainResponse } from '~/api/models/domain-order';
import Axios from 'axios';
import { getAccessToken } from '~/utils/authTokens';

interface UserDomainDetailed {
  id?: number;
  fqdn?: string;
  zoneName?: string;
  activatedAt?: string;
  expiresAt?: string;
}

interface AuditEventDto {
  id: number;
  description: string;
  eventTime: string;
}

const DashboardPage = () => {
  const [domains, setDomains] = useState<DomainResponse[]>([]);
  const [events, setEvents] = useState<
    { id: string; type: 'SYSTEM' | 'USER'; message: string; at: string }[]
  >([]);

  useEffect(() => {
    let isMounted = true;

    const loadDomains = async () => {
      try {
        const { data } = await AXIOS_INSTANCE.get<UserDomainDetailed[]>(
          '/userDomains/detailed'
        );
        if (isMounted) {
          setDomains(
            (data ?? []).map((d) => ({
              id: d.id?.toString(),
              fqdn: d.fqdn,
              zoneName: d.zoneName,
              activatedAt: d.activatedAt,
              expiresAt: d.expiresAt,
            }))
          );
        }
      } catch {
        if (isMounted) setDomains([]);
      }
    };

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
            (data ?? []).slice(0, 10).map((e) => ({
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

    loadDomains();
    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

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
