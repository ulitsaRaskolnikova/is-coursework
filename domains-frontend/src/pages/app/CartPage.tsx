import {
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ORDER_AXIOS_INSTANCE } from '~/api/apiClientOrders';
import { AXIOS_INSTANCE } from '~/api/apiClientDomains';

interface CartResponse {
  totalMonthlyPrice: number;
  totalYearlyPrice: number;
  l3Domains: string[];
}

interface L2Zone {
  id: number;
  name: string;
  monthlyPrice?: number;
}

interface DomainSearchResult {
  fqdn: string;
  zone: string;
  free: boolean;
  monthlyPrice: number;
}

const CartPage = () => {
  const [query, setQuery] = useState('');
  const [cartDomains, setCartDomains] = useState<string[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [totalYearly, setTotalYearly] = useState(0);
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState('');

  const cartCount = useMemo(() => cartDomains.length, [cartDomains]);

  const loadCart = useCallback(async () => {
    setIsCartLoading(true);
    setError('');
    try {
      const { data } = await ORDER_AXIOS_INSTANCE.get<CartResponse>('/cart/me');
      setCartDomains(data.l3Domains ?? []);
      setTotalMonthly(data.totalMonthlyPrice ?? 0);
      setTotalYearly(data.totalYearlyPrice ?? 0);
    } catch {
      setError('Не удалось загрузить корзину.');
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const search = query.trim();
      if (!search) return;

      setIsSearchLoading(true);
      setError('');

      try {
        const [freeRes, zonesRes] = await Promise.all([
          AXIOS_INSTANCE.get<string[]>(`/l3Domains/${encodeURIComponent(search)}/free`),
          AXIOS_INSTANCE.get<L2Zone[]>('/l2Domains'),
        ]);

        const freeDomains = new Set(freeRes.data ?? []);
        const zones = zonesRes.data ?? [];

        const results: DomainSearchResult[] = zones.map((zone) => {
          const fqdn = `${search}.${zone.name}`;
          return {
            fqdn,
            zone: zone.name,
            free: freeDomains.has(fqdn),
            monthlyPrice: zone.monthlyPrice ?? 200,
          };
        });

        setSearchResults(results);
      } catch {
        setError('Не удалось выполнить поиск доменов.');
      } finally {
        setIsSearchLoading(false);
      }
    },
    [query]
  );

  const handleAddToCart = useCallback(
    async (fqdn: string) => {
      setIsCartLoading(true);
      setError('');
      try {
        await ORDER_AXIOS_INSTANCE.post(`/cart/${encodeURIComponent(fqdn)}`);
        await loadCart();
      } catch {
        setError('Не удалось добавить домен в корзину.');
      } finally {
        setIsCartLoading(false);
      }
    },
    [loadCart]
  );

  const handleCheckout = useCallback(
    async (period: 'MONTH' | 'YEAR') => {
      if (cartDomains.length === 0) return;
      setIsCartLoading(true);
      setError('');
      try {
        await ORDER_AXIOS_INSTANCE.post('/cart/checkout', { period });
        setCartDomains([]);
        setTotalMonthly(0);
        setTotalYearly(0);
      } catch {
        setError('Не удалось оформить покупку.');
      } finally {
        setIsCartLoading(false);
      }
    },
    [cartDomains]
  );

  return (
    <Stack gap={4}>
      <HStack justifyContent={'space-between'}>
        <Heading>Корзина</Heading>
        <HStack>
          <Text>{cartCount} доменов</Text>
        </HStack>
      </HStack>

      {/* Cart contents */}
      {cartDomains.length > 0 && (
        <Stack bg={'accent.muted'} p={5} borderRadius={'md'} gap={3}>
          {cartDomains.map((domain) => (
            <HStack key={domain} justifyContent={'space-between'}>
              <Text>{domain}</Text>
            </HStack>
          ))}
          <HStack justifyContent={'space-between'} pt={3} borderTopWidth={1}>
            <Text fontWeight={'bold'}>
              Итого: {totalMonthly}₽/мес · {totalYearly}₽/год
            </Text>
            <HStack>
              <Button
                size={'sm'}
                colorPalette={'secondary'}
                onClick={() => handleCheckout('MONTH')}
                loading={isCartLoading}
              >
                Купить на месяц
              </Button>
              <Button
                size={'sm'}
                colorPalette={'secondary'}
                onClick={() => handleCheckout('YEAR')}
                loading={isCartLoading}
              >
                Купить на год
              </Button>
            </HStack>
          </HStack>
        </Stack>
      )}

      {/* Search */}
      <form onSubmit={handleSubmit}>
        <HStack alignItems={'flex-end'}>
          <Field.Root>
            <Field.Label>Поиск домена</Field.Label>
            <Input
              placeholder="Введите имя домена"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field.Root>
          <Button colorPalette={'accent'} type={'submit'} loading={isSearchLoading}>
            Искать
          </Button>
        </HStack>
      </form>

      {error && (
        <Text color={'fg.error'} fontSize={'sm'}>
          {error}
        </Text>
      )}

      {/* Search results */}
      {searchResults.length > 0 && (
        <Stack bg={'accent.muted'} p={5} borderRadius={'md'} gap={2}>
          <Text fontWeight={'bold'}>Результаты поиска</Text>
          {searchResults.map((result) => (
            <HStack key={result.fqdn} justifyContent={'space-between'}>
              <Text>{result.fqdn}</Text>
              <HStack>
                <Text>{result.monthlyPrice}₽ / месяц</Text>
                {result.free ? (
                  <Button
                    size={'sm'}
                    colorPalette={'secondary'}
                    onClick={() => handleAddToCart(result.fqdn)}
                    loading={isCartLoading}
                  >
                    В корзину
                  </Button>
                ) : (
                  <Text color={'fg.muted'}>Занят</Text>
                )}
              </HStack>
            </HStack>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default CartPage;
