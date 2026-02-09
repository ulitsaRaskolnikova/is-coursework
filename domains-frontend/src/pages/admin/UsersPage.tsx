import {
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import Axios from 'axios';
import { getAccessToken } from '~/utils/authTokens';
import { AXIOS_INSTANCE } from '~/api/apiClientDomains';

const UsersPage = () => {
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [usersRes, statsRes] = await Promise.all([
          Axios.get<{ success: boolean; data: number }>('/api/auth/stats/users-count', { headers }),
          AXIOS_INSTANCE.get<{ activeUsersCount: number; registeredDomainsCount: number }>('/stats'),
        ]);

        setUsersCount(usersRes.data?.data ?? 0);
        setActiveUsers(statsRes.data?.activeUsersCount ?? 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Stack gap={5}>
      <Heading>Пользователи</Heading>
      {loading ? (
        <HStack><Spinner size={'sm'} /><Text>Загрузка...</Text></HStack>
      ) : (
        <Stack bg={'accent.muted'} p={5} borderRadius={'md'} gap={3}>
          <HStack justifyContent={'space-between'}>
            <Text fontWeight={'bold'}>Всего зарегистрировано</Text>
            <Text fontSize={'xl'}>{usersCount ?? '—'}</Text>
          </HStack>
          <HStack justifyContent={'space-between'}>
            <Text fontWeight={'bold'}>Активных (с доменами)</Text>
            <Text fontSize={'xl'}>{activeUsers ?? '—'}</Text>
          </HStack>
        </Stack>
      )}
    </Stack>
  );
};

export default UsersPage;
