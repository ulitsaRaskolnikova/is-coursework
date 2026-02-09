import { Button, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { DomainResponse } from '~/api/models/domain-order';
import { getAllDomains } from '~/api/services/domain-order';
import DomainList from '../../components/dashboard/DomainList';

const DomainsPage = () => {
  const [domains, setDomains] = useState<DomainResponse[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadDomains = async () => {
      try {
        const response = await getAllDomains({
          pageable: {
            page: 0,
            size: 50,
          },
        });
        if (isMounted) {
          setDomains(response?.data?.content ?? []);
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
          <Text>15 доменов</Text>
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
