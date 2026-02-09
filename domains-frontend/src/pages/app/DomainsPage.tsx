import { Button, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let isMounted = true;

    const loadDomains = async () => {
      try {
        const { data } = await AXIOS_INSTANCE.get<UserDomainDetailed[]>('/userDomains/detailed');
        if (isMounted) {
          const mapped: DomainResponse[] = (data ?? []).map((d) => ({
            id: d.id?.toString(),
            fqdn: d.fqdn,
            zoneName: d.zoneName,
            activatedAt: d.activatedAt,
            expiresAt: d.expiresAt,
          }));
          setDomains(mapped);
        }
      } catch {
        if (isMounted) {
          setDomains([]);
        }
      }
    };

    loadDomains();

    return () => {
      isMounted = false;
    };
  }, []);

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
      <DomainList domains={domains} />
    </Stack>
  );
};

export default DomainsPage;
