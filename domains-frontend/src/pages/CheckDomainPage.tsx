import { Button, HStack, Input, Spinner, Stack, Text } from '@chakra-ui/react';
import axios from 'axios';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import type { DomainQuery } from '~/api/models/DomainQuery';
import { DOMAIN_ORDER_URL } from '~/api/Constants';
import { validateDomain } from '../utils/validateDomain';
import { $ok } from '../common/atoms';
import DomainsTable from '~/components/domainsTable/DomainsTable';

const MONTHLY_PRICE = 200;

const CheckDomainPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [input, setInput] = useState(query ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState<DomainQuery[]>([]);

  const fetchDomains = useCallback(async (name: string) => {
    setLoading(true);
    setError('');
    setDomains([]);

    try {
      const [freeRes, zonesRes] = await Promise.all([
        axios.get<string[]>(`${DOMAIN_ORDER_URL}/l3Domains/${encodeURIComponent(name)}/free`),
        axios.get<{ name: string }[]>(`${DOMAIN_ORDER_URL}/l2Domains`),
      ]);

      const freeDomains = new Set(freeRes.data ?? []);
      const zones = zonesRes.data ?? [];

      const results: DomainQuery[] = zones.map((zone) => {
        const fqdn = `${name}.${zone.name}`;
        return {
          fqdn,
          price: MONTHLY_PRICE,
          free: freeDomains.has(fqdn),
        };
      });

      results.sort((a, b) => (a.free === b.free ? 0 : a.free ? -1 : 1));
      setDomains(results);
    } catch (e) {
      setError('Не удалось проверить доступность доменов');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const domain = input.trim().toLocaleLowerCase();
      const [result, reason] = validateDomain(domain);

      if (result === $ok) {
        fetchDomains(domain);
      } else {
        setError(reason);
      }
    },
    [input, fetchDomains]
  );

  useEffect(() => {
    if (!query) return;
    fetchDomains(query);
  }, []);

  return (
    <Stack px={10} py={5} flex={1}>
      <form onSubmit={handleSubmit}>
        <HStack>
          <Input
            fontSize={20}
            p={6}
            placeholder="ваш домен"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
            }}
          />
          <Button fontSize={20} p={6} type={'submit'} colorPalette={'accent'} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Проверить'}
          </Button>
        </HStack>
        {error && (
          <Text color={'red.500'} fontSize={'sm'}>
            {error}
          </Text>
        )}
      </form>
      <DomainsTable domains={domains} />
    </Stack>
  );
};

export default CheckDomainPage;
