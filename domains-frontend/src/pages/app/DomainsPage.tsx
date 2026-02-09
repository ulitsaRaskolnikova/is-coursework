import { Button, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import type { DomainResponse } from '~/api/models/domain-order';
import { AXIOS_INSTANCE } from '~/api/apiClientDomains';
import DomainList from '../../components/dashboard/DomainList';

interface UserDomainDetailed {
  id?: number;
  fqdn?: string;
  zoneName?: string;
  activatedAt?: string;
  expiresAt?: string;
}

const DomainsPage = () => {
  const [domains, setDomains] = useState<DomainResponse[]>([]);

  const loadDomains = useCallback(async () => {
    try {
      const { data } = await AXIOS_INSTANCE.get<UserDomainDetailed[]>('/userDomains/detailed');
      const mapped: DomainResponse[] = (data ?? []).map((d) => ({
        id: d.id?.toString(),
        fqdn: d.fqdn,
        zoneName: d.zoneName,
        activatedAt: d.activatedAt,
        expiresAt: d.expiresAt,
      }));
      setDomains(mapped);
    } catch {
      setDomains([]);
    }
  }, []);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  return (
    <Stack gap={5}>
      <HStack justifyContent={'space-between'}>
        <Heading>Мои домены</Heading>
        <HStack>
          <Text>{domains.length} доменов</Text>
          <Button colorPalette={'secondary'} size={'sm'}>
            купить новый
          </Button>
        </HStack>
      </HStack>
      <DomainList domains={domains} onRenewed={loadDomains} />
    </Stack>
  );
};

export default DomainsPage;
