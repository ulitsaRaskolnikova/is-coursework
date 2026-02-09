import {
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { AXIOS_INSTANCE } from '~/api/apiClientDomains';

const FinancesPage = () => {
  const [domainsCount, setDomainsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await AXIOS_INSTANCE.get<{
          activeUsersCount: number;
          registeredDomainsCount: number;
        }>('/stats');
        setDomainsCount(data?.registeredDomainsCount ?? 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const monthlyPrice = 200;
  const monthlyRevenue = (domainsCount ?? 0) * monthlyPrice;

  return (
    <Stack gap={5}>
      <Heading>Финансы</Heading>
      {loading ? (
        <HStack><Spinner size={'sm'} /><Text>Загрузка...</Text></HStack>
      ) : (
        <Stack bg={'accent.muted'} p={5} borderRadius={'md'} gap={3}>
          <HStack justifyContent={'space-between'}>
            <Text fontWeight={'bold'}>Активных доменов</Text>
            <Text fontSize={'xl'}>{domainsCount ?? '—'}</Text>
          </HStack>
          <HStack justifyContent={'space-between'}>
            <Text fontWeight={'bold'}>Ежемесячный доход (оценка)</Text>
            <Text fontSize={'xl'}>{monthlyRevenue} ₽</Text>
          </HStack>
          <HStack justifyContent={'space-between'}>
            <Text fontWeight={'bold'}>Годовой доход (оценка)</Text>
            <Text fontSize={'xl'}>{monthlyRevenue * 12} ₽</Text>
          </HStack>
        </Stack>
      )}
    </Stack>
  );
};

export default FinancesPage;
