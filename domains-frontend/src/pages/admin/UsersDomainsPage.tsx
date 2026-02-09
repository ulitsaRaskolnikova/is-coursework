import {
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import DateText from '~/components/DateText';
import { AXIOS_INSTANCE } from '~/api/apiClientDomains';

interface ExpiringDomain {
  userId: string;
  domainName: string;
  finishedAt: string;
}

const UsersDomainsPage = () => {
  const [expiring7, setExpiring7] = useState<ExpiringDomain[]>([]);
  const [expiring30, setExpiring30] = useState<ExpiringDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res7, res30] = await Promise.all([
        AXIOS_INSTANCE.get<ExpiringDomain[]>('/userDomains/expiring?days=7'),
        AXIOS_INSTANCE.get<ExpiringDomain[]>('/userDomains/expiring?days=30'),
      ]);
      setExpiring7(res7.data ?? []);
      setExpiring30(res30.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCleanup = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const { data } = await AXIOS_INSTANCE.delete<number>('/userDomains/expired');
      setCleanupResult(`Удалено ${data} просроченных доменов`);
      await loadData();
    } catch {
      setCleanupResult('Ошибка при очистке');
    } finally {
      setCleanupLoading(false);
    }
  };

  const renderTable = (domains: ExpiringDomain[]) => (
    <Grid
      templateColumns={'1fr 1fr auto'}
      rowGap={2}
      columnGap={5}
      bg={'accent.muted'}
      p={5}
      borderRadius={'md'}
      alignItems={'center'}
    >
      <GridItem><Text fontWeight={'bold'}>домен</Text></GridItem>
      <GridItem><Text fontWeight={'bold'}>пользователь</Text></GridItem>
      <GridItem><Text fontWeight={'bold'}>истекает</Text></GridItem>

      {domains.map((d, i) => (
        <>
          <GridItem key={`${i}-name`}>{d.domainName}</GridItem>
          <GridItem key={`${i}-user`}>
            <Text fontSize={'sm'} color={'fg.muted'}>{d.userId?.substring(0, 8)}...</Text>
          </GridItem>
          <GridItem key={`${i}-date`}>
            {d.finishedAt && <DateText>{d.finishedAt}</DateText>}
          </GridItem>
        </>
      ))}
    </Grid>
  );

  return (
    <Stack gap={5}>
      <HStack justifyContent={'space-between'}>
        <Heading>Домены</Heading>
        <HStack>
          <Button
            size={'sm'}
            colorPalette={'red'}
            onClick={handleCleanup}
            loading={cleanupLoading}
          >
            Удалить просроченные
          </Button>
        </HStack>
      </HStack>

      {cleanupResult && <Text color={'green.500'}>{cleanupResult}</Text>}

      {loading ? (
        <HStack><Spinner size={'sm'} /><Text>Загрузка...</Text></HStack>
      ) : (
        <>
          <Stack>
            <Text fontWeight={'bold'}>Истекают в ближайшие 7 дней ({expiring7.length})</Text>
            {expiring7.length > 0 ? renderTable(expiring7) : <Text color={'fg.muted'}>Нет</Text>}
          </Stack>

          <Stack>
            <Text fontWeight={'bold'}>Истекают в ближайшие 30 дней ({expiring30.length})</Text>
            {expiring30.length > 0 ? renderTable(expiring30) : <Text color={'fg.muted'}>Нет</Text>}
          </Stack>
        </>
      )}
    </Stack>
  );
};

export default UsersDomainsPage;
