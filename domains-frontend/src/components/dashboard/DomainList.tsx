import React, { useState } from 'react';
import type { DomainResponse } from '../../api/models';
import { Button, Grid, GridItem, HStack, Text } from '@chakra-ui/react';
import DateText from '../DateText';
import Axios from 'axios';
import { getAccessToken } from '~/utils/authTokens';
import { PAYMENT_URL } from '~/api/Constants';

const PAYMENT_ID_STORAGE_KEY = 'payment:lastId';

const MONTHLY_PRICE = 200;
const YEARLY_DISCOUNT = 0.7;

interface PaymentCreateResponse {
  paymentId: string;
  paymentUrl: string;
  operationId?: string;
  status?: string;
  amount?: number;
  currency?: string;
}

type Props = {
  domains: DomainResponse[];
  onRenewed?: () => void;
};

const DomainList = (props: Props) => {
  const [renewingFqdn, setRenewingFqdn] = useState<string | null>(null);
  const [renewedFqdns, setRenewedFqdns] = useState<Set<string>>(new Set());

  const handleRenew = async (fqdn: string, period: 'MONTH' | 'YEAR') => {
    setRenewingFqdn(fqdn);
    try {
      const amountInRubles = period === 'YEAR' 
        ? Math.round(MONTHLY_PRICE * 12 * YEARLY_DISCOUNT)
        : MONTHLY_PRICE;
      const amountInKopecks = amountInRubles * 100;

      const token = getAccessToken();
      const { data } = await Axios.post<PaymentCreateResponse>(
        `${PAYMENT_URL}/`,
        {
          l3Domains: [fqdn],
          period,
          amount: amountInKopecks,
          currency: 'RUB',
          description: `Продление домена ${fqdn} на ${period === 'MONTH' ? '1 месяц' : '1 год'}`,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (data?.paymentUrl && data?.paymentId) {
        localStorage.setItem(PAYMENT_ID_STORAGE_KEY, data.paymentId);
        window.location.assign(data.paymentUrl);
      } else {
        throw new Error('Payment link missing');
      }
    } catch {
      setRenewingFqdn(null);
    }
  };

  return (
    <Grid
      templateColumns={'50% 20% auto'}
      rowGap={2}
      bg={'accent.muted'}
      alignItems={'center'}
      px={5}
      py={2.5}
      borderRadius={'sm'}
    >
      {props.domains.map((domain) => {
        const fqdn = domain.fqdn ?? '';
        const isRenewing = renewingFqdn === fqdn;
        const wasRenewed = renewedFqdns.has(fqdn);

        return (
          <React.Fragment key={domain.id ?? fqdn}>
            <GridItem>
              <Text>{fqdn}</Text>
            </GridItem>
            <GridItem>
              {domain.expiresAt ? (
                <Text>
                  до <DateText as={'span'}>{domain.expiresAt}</DateText>
                </Text>
              ) : (
                <Text color="fg.muted">—</Text>
              )}
            </GridItem>
            <GridItem>
              <HStack justifyContent={'flex-end'}>
                {wasRenewed ? (
                  <Button size={'sm'} colorPalette={'green'} variant={'solid'} disabled>
                    Продлён
                  </Button>
                ) : (
                  <>
                    <Button
                      size={'sm'}
                      colorPalette={'secondary'}
                      onClick={() => handleRenew(fqdn, 'MONTH')}
                      loading={isRenewing}
                      disabled={renewingFqdn !== null && !isRenewing}
                    >
                      +1 мес
                    </Button>
                    <Button
                      size={'sm'}
                      colorPalette={'secondary'}
                      onClick={() => handleRenew(fqdn, 'YEAR')}
                      loading={isRenewing}
                      disabled={renewingFqdn !== null && !isRenewing}
                    >
                      +1 год
                    </Button>
                  </>
                )}
              </HStack>
            </GridItem>
          </React.Fragment>
        );
      })}
    </Grid>
  );
};

export default DomainList;
