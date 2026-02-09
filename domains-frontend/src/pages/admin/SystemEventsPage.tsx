import { Grid, GridItem, Heading, HStack, Spinner, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import DateText from '~/components/DateText';
import Axios from 'axios';
import { getAccessToken } from '~/utils/authTokens';

interface AuditEvent {
  id: number;
  description: string;
  userId: string | null;
  eventTime: string;
}

const SystemEventsPage = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = getAccessToken();
        const { data } = await Axios.get<AuditEvent[]>('/api/audit/events/all?limit=200', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setEvents(data ?? []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Stack>
      <Heading>События ({events.length})</Heading>
      {loading ? (
        <HStack><Spinner size={'sm'} /><Text>Загрузка...</Text></HStack>
      ) : events.length === 0 ? (
        <Text color={'fg.muted'}>Нет событий</Text>
      ) : (
        <Grid
          templateColumns={'auto 1fr auto'}
          rowGap={2}
          columnGap={5}
          bg={'accent.muted'}
          p={5}
          borderRadius={'md'}
          alignItems={'center'}
        >
          <GridItem>
            <Text fontWeight={'bold'}>пользователь</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight={'bold'}>действие</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight={'bold'}>дата</Text>
          </GridItem>

          {events.map((e) => (
            <>
              <GridItem key={`${e.id}-user`}>
                <Text fontSize={'sm'} color={'fg.muted'}>
                  {e.userId ? e.userId.substring(0, 8) + '...' : 'система'}
                </Text>
              </GridItem>
              <GridItem key={`${e.id}-desc`}>
                <Text fontSize={'sm'}>{e.description}</Text>
              </GridItem>
              <GridItem key={`${e.id}-time`}>
                {e.eventTime && <DateText>{e.eventTime}</DateText>}
              </GridItem>
            </>
          ))}
        </Grid>
      )}
    </Stack>
  );
};

export default SystemEventsPage;
