import { Button, HStack, Input, Stack, Table, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import DomainRow from '../components/domainsTable/DomainRow';
import { validateDomain } from '../utils/validateDomain';
import { $ok } from '../common/atoms';
import DomainsTable from '~/components/domainsTable/DomainsTable';

const CheckDomainPage = () => {
  const [searchParams, _] = useSearchParams();
  const query = searchParams.get('q');
  const [input, setInput] = useState(query ?? '');
  const [error, setError] = useState('');

  const [domains, setDomains] = useState(
    query
      ? ['.goip.pw', '.godns.pw', '.gofrom.pw'].map((domain) => ({
          fqdn: `${query}${domain}`,
          price: 50,
          free: Math.random() > 0.5,
        }))
      : []
  );

  const fetchDomains = (domain: string) => {
    console.log('Fetch Domains');

    // TODO Fetch domains
  };

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
    [input]
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
          <Button fontSize={20} p={6} type={'submit'} colorPalette={'accent'}>
            Проверить
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
