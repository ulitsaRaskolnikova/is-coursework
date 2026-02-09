import {
  Button,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { AXIOS_INSTANCE } from '~/api/apiClientDomains';
import Axios from 'axios';
import { getAccessToken } from '~/utils/authTokens';

const authHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminDashboardPage = () => {
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [domainsCount, setDomainsCount] = useState<number | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, statsRes] = await Promise.all([
          Axios.get<{ success: boolean; data: number }>('/api/auth/stats/users-count', { headers: authHeaders() }),
          AXIOS_INSTANCE.get<{ activeUsersCount: number; registeredDomainsCount: number }>('/stats'),
        ]);
        setUsersCount(usersRes.data?.data ?? 0);
        setDomainsCount(statsRes.data?.registeredDomainsCount ?? 0);
        setActiveUsers(statsRes.data?.activeUsersCount ?? 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadReport = async () => {
    setReportLoading(true);
    try {
      const res = await Axios.get('/api/admin/report', {
        headers: authHeaders(),
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <Stack gap={5}>
      <Heading>Админ-панель</Heading>

      {loading ? (
        <HStack><Spinner size={'sm'} /> <Text>Загрузка статистики...</Text></HStack>
      ) : (
        <HStack gap={5}>
          <Stack>
            <Text fontWeight={'bold'}>Всего пользователей</Text>
            <Stack
              width={'12em'}
              bg={'accent.muted'}
              borderRadius={'md'}
              py={5}
              alignItems={'center'}
            >
              <Text fontSize={'xl'}>{usersCount ?? '—'}</Text>
            </Stack>
          </Stack>

          <Stack>
            <Text fontWeight={'bold'}>Активных пользователей</Text>
            <Stack
              width={'12em'}
              bg={'accent.muted'}
              borderRadius={'md'}
              py={5}
              alignItems={'center'}
            >
              <Text fontSize={'xl'}>{activeUsers ?? '—'}</Text>
            </Stack>
          </Stack>

          <Stack>
            <Text fontWeight={'bold'}>Зарег. доменов</Text>
            <Stack
              width={'12em'}
              bg={'accent.muted'}
              borderRadius={'md'}
              py={5}
              alignItems={'center'}
            >
              <Text fontSize={'xl'}>{domainsCount ?? '—'}</Text>
            </Stack>
          </Stack>
        </HStack>
      )}

      <Stack alignItems={'flex-start'} gap={3}>
        <Text fontWeight={'bold'}>Отчёт</Text>
        <Button
          colorPalette={'accent'}
          onClick={handleDownloadReport}
          loading={reportLoading}
        >
          Скачать отчёт
        </Button>
      </Stack>
    </Stack>
  );
};

export default AdminDashboardPage;
