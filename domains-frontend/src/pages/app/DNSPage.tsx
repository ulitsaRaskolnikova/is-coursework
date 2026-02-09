import {
  Accordion,
  Badge,
  Box,
  Button,
  createListCollection,
  Field,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  Portal,
  Select,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AXIOS_INSTANCE } from '~/api/apiClientDomains';

/* ───── types ───── */

type DnsRecordType = 'A' | 'AAAA' | 'NS' | 'MX' | 'TXT' | 'CNAME' | 'SOA';

interface DnsRecord {
  id: number;
  name: string;
  type: DnsRecordType;
  ttl: number;
  data: unknown;
}

interface UserDomain {
  id?: number;
  fqdn?: string;
}

/* ───── helpers ───── */

const DNS_TYPES: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SOA'];

const dnsTypesCollection = createListCollection({
  items: DNS_TYPES.map((t) => ({ label: t, value: t })),
});

/** Human-readable representation of a record's data */
const formatData = (type: DnsRecordType, data: unknown): string => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string') return data;
  if (type === 'MX' && typeof data === 'object') {
    const mx = data as { preference?: number; exchange?: string };
    return `${mx.preference ?? 0} ${mx.exchange ?? ''}`;
  }
  if (type === 'SOA' && typeof data === 'object') {
    const soa = data as {
      mname?: string; rname?: string; serial?: number;
      refresh?: number; retry?: number; expire?: number; minimum?: number;
    };
    return `${soa.mname} ${soa.rname} ${soa.serial} ${soa.refresh} ${soa.retry} ${soa.expire} ${soa.minimum}`;
  }
  return JSON.stringify(data);
};

/* ───── component ───── */

const DNSPage = () => {
  /* domain list */
  const [domains, setDomains] = useState<UserDomain[]>([]);
  const [selectedFqdn, setSelectedFqdn] = useState<string | null>(null);

  /* records */
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  /* add form */
  const [newType, setNewType] = useState<DnsRecordType>('A');
  const [newName, setNewName] = useState('');
  const [newTtl, setNewTtl] = useState('300');
  // simple fields (A, AAAA, NS, TXT, CNAME)
  const [newData, setNewData] = useState('');
  // MX fields
  const [mxPreference, setMxPreference] = useState('10');
  const [mxExchange, setMxExchange] = useState('');
  // SOA fields
  const [soaMname, setSoaMname] = useState('');
  const [soaRname, setSoaRname] = useState('');
  const [soaSerial, setSoaSerial] = useState('1');
  const [soaRefresh, setSoaRefresh] = useState('3600');
  const [soaRetry, setSoaRetry] = useState('600');
  const [soaExpire, setSoaExpire] = useState('1209600');
  const [soaMinimum, setSoaMinimum] = useState('300');

  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const domainCollection = useMemo(
    () => createListCollection({ items: domains.map((d) => ({ label: d.fqdn ?? '', value: d.fqdn ?? '' })) }),
    [domains]
  );

  /* load user domains */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await AXIOS_INSTANCE.get<UserDomain[]>('/userDomains/detailed');
        setDomains(data ?? []);
      } catch { /* ignore */ }
    })();
  }, []);

  /* load records when domain changes */
  const loadRecords = useCallback(async (fqdn: string) => {
    setLoadingRecords(true);
    setError('');
    try {
      const { data } = await AXIOS_INSTANCE.get<DnsRecord[]>(
        `/l3Domains/${encodeURIComponent(fqdn)}/dnsRecords`
      );
      setRecords(data ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFqdn) loadRecords(selectedFqdn);
    else setRecords([]);
  }, [selectedFqdn, loadRecords]);

  /* build request body for new record */
  const buildRecordBody = () => {
    const base = { name: newName || selectedFqdn, type: newType, ttl: Number(newTtl) || 300 };

    switch (newType) {
      case 'A':
      case 'AAAA':
      case 'NS':
      case 'TXT':
      case 'CNAME':
        return { ...base, data: newData };
      case 'MX':
        return { ...base, data: { preference: Number(mxPreference) || 0, exchange: mxExchange } };
      case 'SOA':
        return {
          ...base,
          data: {
            mname: soaMname, rname: soaRname,
            serial: Number(soaSerial) || 1,
            refresh: Number(soaRefresh) || 3600,
            retry: Number(soaRetry) || 600,
            expire: Number(soaExpire) || 1209600,
            minimum: Number(soaMinimum) || 300,
          },
        };
      default:
        return { ...base, data: newData };
    }
  };

  const handleAdd = async () => {
    if (!selectedFqdn) return;
    setAdding(true);
    setError('');
    try {
      await AXIOS_INSTANCE.post(`/l3Domains/${encodeURIComponent(selectedFqdn)}`, buildRecordBody());
      await loadRecords(selectedFqdn);
      setNewData('');
      setMxExchange('');
    } catch (e: unknown) {
      setError('Не удалось создать запись');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedFqdn) return;
    setDeletingId(id);
    try {
      await AXIOS_INSTANCE.delete(`/dnsRecords/${id}`);
      await loadRecords(selectedFqdn);
    } catch {
      setError('Не удалось удалить запись');
    } finally {
      setDeletingId(null);
    }
  };

  /* ───── render ───── */

  const renderDataFields = () => {
    switch (newType) {
      case 'A':
        return (
          <Field.Root>
            <Field.Label>IPv4 адрес</Field.Label>
            <Input placeholder="1.2.3.4" bg={'bg'} value={newData} onChange={(e) => setNewData(e.target.value)} />
          </Field.Root>
        );
      case 'AAAA':
        return (
          <Field.Root>
            <Field.Label>IPv6 адрес</Field.Label>
            <Input placeholder="2001:db8::1" bg={'bg'} value={newData} onChange={(e) => setNewData(e.target.value)} />
          </Field.Root>
        );
      case 'CNAME':
        return (
          <Field.Root>
            <Field.Label>Каноническое имя (FQDN)</Field.Label>
            <Input placeholder="alias.example.com" bg={'bg'} value={newData} onChange={(e) => setNewData(e.target.value)} />
          </Field.Root>
        );
      case 'TXT':
        return (
          <Field.Root>
            <Field.Label>Текст</Field.Label>
            <Input placeholder="v=spf1 ..." bg={'bg'} value={newData} onChange={(e) => setNewData(e.target.value)} />
          </Field.Root>
        );
      case 'NS':
        return (
          <Field.Root>
            <Field.Label>Name Server (FQDN)</Field.Label>
            <Input placeholder="ns1.example.com" bg={'bg'} value={newData} onChange={(e) => setNewData(e.target.value)} />
          </Field.Root>
        );
      case 'MX':
        return (
          <HStack gap={4}>
            <Field.Root>
              <Field.Label>Приоритет</Field.Label>
              <Input type="number" placeholder="10" bg={'bg'} value={mxPreference} onChange={(e) => setMxPreference(e.target.value)} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Mail Server (FQDN)</Field.Label>
              <Input placeholder="mx1.example.com" bg={'bg'} value={mxExchange} onChange={(e) => setMxExchange(e.target.value)} />
            </Field.Root>
          </HStack>
        );
      case 'SOA':
        return (
          <Stack gap={3}>
            <HStack gap={4}>
              <Field.Root>
                <Field.Label>Primary NS (mname)</Field.Label>
                <Input placeholder="ns1.example.com" bg={'bg'} value={soaMname} onChange={(e) => setSoaMname(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Email (rname)</Field.Label>
                <Input placeholder="hostmaster.example.com" bg={'bg'} value={soaRname} onChange={(e) => setSoaRname(e.target.value)} />
              </Field.Root>
            </HStack>
            <HStack gap={4}>
              <Field.Root>
                <Field.Label>Serial</Field.Label>
                <Input type="number" bg={'bg'} value={soaSerial} onChange={(e) => setSoaSerial(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Refresh</Field.Label>
                <Input type="number" bg={'bg'} value={soaRefresh} onChange={(e) => setSoaRefresh(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Retry</Field.Label>
                <Input type="number" bg={'bg'} value={soaRetry} onChange={(e) => setSoaRetry(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Expire</Field.Label>
                <Input type="number" bg={'bg'} value={soaExpire} onChange={(e) => setSoaExpire(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Minimum</Field.Label>
                <Input type="number" bg={'bg'} value={soaMinimum} onChange={(e) => setSoaMinimum(e.target.value)} />
              </Field.Root>
            </HStack>
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <Stack gap={4}>
      <Heading>DNS</Heading>

      {/* domain selector */}
      <Select.Root
        collection={domainCollection}
        onValueChange={(details) => setSelectedFqdn(details.value[0] ?? null)}
      >
        <Select.HiddenSelect />
        <Select.Label>Выберите домен</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Выберите домен" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {domainCollection.items.map((item) => (
                <Select.Item item={item} key={item.value}>
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>

      {!selectedFqdn && <Text color={'fg.muted'}>Выберите домен для управления DNS-записями</Text>}

      {selectedFqdn && (
        <Accordion.Root multiple defaultValue={['add', 'list']}>
          {/* ── Add record ── */}
          <Accordion.Item value={'add'}>
            <Accordion.ItemTrigger>
              <Text fontWeight={'bold'}>Добавить запись</Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Stack bg={'accent.muted'} p={5} borderRadius={'md'} gap={4}>
                  <HStack gap={4}>
                    <Field.Root>
                      <Field.Label>Имя записи</Field.Label>
                      <Input
                        placeholder={selectedFqdn}
                        bg={'bg'}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Тип</Field.Label>
                      <Select.Root
                        collection={dnsTypesCollection}
                        value={[newType]}
                        onValueChange={(d) => setNewType((d.value[0] as DnsRecordType) ?? 'A')}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger bg={'bg'}>
                            <Select.ValueText />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {dnsTypesCollection.items.map((t) => (
                                <Select.Item item={t} key={t.value}>
                                  {t.label}
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>TTL</Field.Label>
                      <Input
                        type="number"
                        bg={'bg'}
                        value={newTtl}
                        onChange={(e) => setNewTtl(e.target.value)}
                        width={'100px'}
                      />
                    </Field.Root>
                  </HStack>

                  {renderDataFields()}

                  {error && <Text color={'fg.error'} fontSize={'sm'}>{error}</Text>}

                  <Box>
                    <Button
                      colorPalette={'secondary'}
                      size={'sm'}
                      onClick={handleAdd}
                      loading={adding}
                    >
                      Добавить
                    </Button>
                  </Box>
                </Stack>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>

          {/* ── Record list ── */}
          <Accordion.Item value={'list'}>
            <Accordion.ItemTrigger>
              <Text fontWeight={'bold'}>Записи ({records.length})</Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                {loadingRecords ? (
                  <HStack justifyContent={'center'} py={5}><Spinner /></HStack>
                ) : records.length === 0 ? (
                  <Text color={'fg.muted'}>Нет DNS-записей</Text>
                ) : (
                  <Stack bg={'accent.muted'} p={5} borderRadius={'md'} gap={2}>
                    <Grid templateColumns={'80px 1fr auto auto'} gap={2} alignItems={'center'}>
                      <GridItem><Text fontWeight={'bold'} fontSize={'sm'}>Тип</Text></GridItem>
                      <GridItem><Text fontWeight={'bold'} fontSize={'sm'}>Значение</Text></GridItem>
                      <GridItem><Text fontWeight={'bold'} fontSize={'sm'}>TTL</Text></GridItem>
                      <GridItem />
                    </Grid>
                    {records.map((rec) => (
                      <Grid
                        key={rec.id}
                        templateColumns={'80px 1fr auto auto'}
                        gap={2}
                        alignItems={'center'}
                        bg={'bg'}
                        px={3}
                        py={2}
                        borderRadius={'sm'}
                      >
                        <GridItem>
                          <Badge colorPalette={'secondary'}>{rec.type}</Badge>
                        </GridItem>
                        <GridItem>
                          <Text fontSize={'sm'} wordBreak={'break-all'}>
                            {formatData(rec.type, rec.data)}
                          </Text>
                        </GridItem>
                        <GridItem>
                          <Text fontSize={'sm'} color={'fg.muted'}>{rec.ttl}s</Text>
                        </GridItem>
                        <GridItem>
                          <Button
                            size={'xs'}
                            colorPalette={'red'}
                            onClick={() => handleDelete(rec.id)}
                            loading={deletingId === rec.id}
                            disabled={deletingId !== null && deletingId !== rec.id}
                          >
                            удалить
                          </Button>
                        </GridItem>
                      </Grid>
                    ))}
                  </Stack>
                )}
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      )}
    </Stack>
  );
};

export default DNSPage;
