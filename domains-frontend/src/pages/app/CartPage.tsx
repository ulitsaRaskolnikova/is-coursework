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
import type { DomainQuery } from '~/api/models/DomainQuery';
import { RecordType, type Zone as ExdnsZone } from '~/api/models/exdns';
import {
  AddCartItemRequestAction,
  AddCartItemRequestTerm,
} from '~/api/models/domain-order';
import {
  addItem,
  clearCart,
  createDomain,
  getCart,
  getZoneByName,
  removeItem,
  searchDomains,
} from '~/api/services/domain-order';
import { postZonesDomain } from '~/api/services/exdns';
import DomainsTable from '~/components/domainsTable/DomainsTable';

type CartDomain = DomainQuery & { itemId?: string };

type DomainSearchItem = {
  fqdn?: string;
  price?: number;
  free?: boolean;
};

type CartItem = {
  id?: string;
  fqdn?: string;
  price?: number;
};

const mapCartItems = (items: CartItem[]): CartDomain[] =>
  items.map((item) => ({
    itemId: item.id,
    fqdn: item.fqdn ?? '',
    price: item.price ?? 0,
    free: false,
  }));

const mapSearchItems = (items: DomainSearchItem[]): DomainQuery[] =>
  items.map((item) => ({
    fqdn: item.fqdn ?? '',
    price: item.price ?? 0,
    free: Boolean(item.free),
  }));

const resolveZoneId = async (fqdn: string) => {
  const parts = fqdn.split('.').filter(Boolean);
  if (parts.length <= 2) return '';

  const zoneName = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  const zoneResponse = await getZoneByName(zoneName);
  return zoneResponse?.data?.id ?? '';
};

const buildZonePayload = (fqdn: string): ExdnsZone => ({
  name: fqdn,
  version: 1,
  records: [
    {
      name: '@',
      type: RecordType.A,
      ttl: 300,
      data: '127.0.0.1',
    },
  ],
});

const CartPage = () => {
  const [query, setQuery] = useState<string>('');
  const [cartDomains, setCartDomains] = useState<CartDomain[]>([]);
  const [domains, setDomains] = useState<DomainQuery[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState('');

  const cartCount = useMemo(() => cartDomains.length, [cartDomains]);

  const loadCart = useCallback(async () => {
    setIsCartLoading(true);
    setError('');

    try {
      const response = await getCart();
      const items = response?.data?.items ?? [];
      setCartDomains(mapCartItems(items));
    } catch {
      setError('Не удалось загрузить корзину. Попробуйте еще раз.');
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
        const response = await searchDomains({ query: search });
        const items = response?.data ?? [];
        setDomains(mapSearchItems(items));
      } catch {
        setError('Не удалось выполнить поиск доменов. Попробуйте еще раз.');
      } finally {
        setIsSearchLoading(false);
      }
    },
    [query]
  );

  const handlePurchase = useCallback(async () => {
    if (cartDomains.length === 0) return;

    setIsCartLoading(true);
    setError('');

    try {
      for (const domain of cartDomains) {
        const fqdn = domain.fqdn.trim();
        if (!fqdn) continue;

        const zoneId = await resolveZoneId(fqdn);
        if (!zoneId) {
          throw new Error('zone');
        }

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await createDomain({
          fqdn,
          zoneId,
          expiresAt: expiresAt.toISOString(),
        });
        await postZonesDomain(fqdn, buildZonePayload(fqdn));
      }

      await clearCart();
      setCartDomains([]);
    } catch {
      setError('Не удалось оформить покупку. Попробуйте еще раз.');
    } finally {
      setIsCartLoading(false);
    }
  }, [cartDomains]);

  const handleAddToCart = useCallback(
    async (domain: DomainQuery) => {
      if (!domain.free) return;

      setIsCartLoading(true);
      setError('');

      try {
        await addItem({
          action: AddCartItemRequestAction.register,
          term: AddCartItemRequestTerm.yearly,
          fqdn: domain.fqdn,
          price: domain.price,
        });
        await loadCart();
      } catch {
        setError('Не удалось добавить домен в корзину. Попробуйте еще раз.');
      } finally {
        setIsCartLoading(false);
      }
    },
    [loadCart]
  );

  const handleRemoveFromCart = useCallback(async (domain: CartDomain) => {
    if (!domain.itemId) return;

    setIsCartLoading(true);
    setError('');

    try {
      await removeItem(domain.itemId);
      setCartDomains((prev) => prev.filter((item) => item.itemId !== domain.itemId));
    } catch {
      setError('Не удалось удалить домен из корзины. Попробуйте еще раз.');
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  return (
    <Stack gap={4}>
      <HStack justifyContent={'space-between'}>
        <Heading>Корзина</Heading>
        <HStack>
          <Text>{cartCount} доменов</Text>
          <Button
            size={'sm'}
            colorPalette={'secondary'}
            onClick={handlePurchase}
            loading={isCartLoading}
          >
            Приобрести
          </Button>
        </HStack>
      </HStack>
      <form onSubmit={handleSubmit}>
        <HStack alignItems={'flex-end'}>
          <Field.Root>
            <Field.Label>Домен</Field.Label>
            <Input
              placeholder="Введите домен"
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
      <DomainsTable
        domains={cartDomains}
        buttonsFunction={(domain) => (
          <Button
            size={'sm'}
            colorPalette={'secondary'}
            onClick={() => handleRemoveFromCart(domain as CartDomain)}
            loading={isCartLoading}
          >
            Удалить
          </Button>
        )}
      />
      <Box my={2} />
      <Text>Доступные домены</Text>
      <DomainsTable
        domains={domains}
        buttonsFunction={(domain) =>
          domain.free ? (
            <Button
              size={'sm'}
              colorPalette={'secondary'}
              onClick={() => handleAddToCart(domain)}
              loading={isCartLoading}
            >
              В корзину
            </Button>
          ) : (
            <Text>Недоступен</Text>
          )
        }
      />
    </Stack>
  );
};

export default CartPage;
