import { Button, Heading, HStack, Spinner, Stack, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Axios from 'axios';
import { getAccessToken } from '~/utils/authTokens';

const PAYMENT_ID_STORAGE_KEY = 'payment:lastId';

interface PaymentStatusResponse {
  paymentId: string;
  status: string;
  paid: boolean;
  domainsCreated: boolean;
  operationStatus?: string;
  paymentUrl?: string;
  amount?: number;
  currency?: string;
}

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState('');

  const paymentId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('paymentId') || localStorage.getItem(PAYMENT_ID_STORAGE_KEY);
  }, [location.search]);

  const checkPayment = useCallback(async () => {
    if (!paymentId) {
      setError('Не удалось определить платеж.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const token = getAccessToken();
      const { data } = await Axios.post<PaymentStatusResponse>(
        `/api/payments/${paymentId}/check`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setStatus(data ?? null);
      if (data?.paid) {
        localStorage.removeItem(PAYMENT_ID_STORAGE_KEY);
      }
    } catch {
      setError('Не удалось проверить платеж.');
    } finally {
      setIsLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    checkPayment();
  }, [checkPayment]);

  const getHeading = () => {
    if (status?.paid) return 'Платеж успешно завершен';
    if (status?.status === 'FAILED') return 'Платеж не прошел';
    return 'Платеж в обработке';
  };

  const getDescription = () => {
    if (status?.paid) return 'Домены будут добавлены в ваш аккаунт.';
    if (status?.status === 'FAILED') {
      return 'Оплата не была завершена. Если вы не завершили оплату на странице ЮKassa, попробуйте оплатить снова.';
    }
    if (status?.status === 'PENDING') {
      return 'Оплата еще не завершена. Если вы завершили оплату на странице ЮKassa, подождите несколько секунд и нажмите "Проверить снова".';
    }
    return 'Мы проверяем оплату. Попробуйте обновить статус через пару минут.';
  };

  return (
    <Stack minHeight={'100dvh'} alignItems={'center'} justifyContent={'center'}>
      <Stack
        maxW={'560px'}
        width={'100%'}
        bg={'accent.muted'}
        borderRadius={'lg'}
        p={8}
        gap={4}
      >
        {isLoading ? (
          <HStack justifyContent={'center'}>
            <Spinner color={'secondary.solid'} />
            <Text>Проверяем оплату...</Text>
          </HStack>
        ) : (
          <>
            <Heading size={'lg'}>{error ? 'Ошибка' : getHeading()}</Heading>
            <Text color={'fg.muted'}>{error ? error : getDescription()}</Text>
            {status && !error && (
              <>
                <Text color={'fg.subtle'}>
                  Статус: {status.status}
                  {status.operationStatus ? ` (${status.operationStatus})` : ''}
                </Text>
                {status.paymentUrl && status.status === 'PENDING' && (
                  <Button
                    colorPalette={'accent'}
                    onClick={() => window.location.assign(status.paymentUrl!)}
                  >
                    Вернуться к оплате
                  </Button>
                )}
              </>
            )}
            <HStack gap={3} flexWrap={'wrap'}>
              <Button
                colorPalette={'secondary'}
                onClick={() => navigate('/app/domains')}
                disabled={!status?.paid}
              >
                К моим доменам
              </Button>
              <Button variant={'subtle'} onClick={() => navigate('/app/cart')}>
                В корзину
              </Button>
              <Button variant={'outline'} onClick={checkPayment}>
                Проверить снова
              </Button>
            </HStack>
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default PaymentSuccessPage;
