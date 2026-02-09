import React, { useState } from 'react';
import type { DomainResponse } from '../../api/models';
import { Button, Grid, GridItem, HStack, Text } from '@chakra-ui/react';
import DateText from '../DateText';
import { ArrowRight } from 'lucide-react';
import { ORDER_AXIOS_INSTANCE } from '~/api/apiClientOrders';

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
      await ORDER_AXIOS_INSTANCE.post('/domains/renew', {
        l3Domains: [fqdn],
        period,
      });
      setRenewedFqdns((prev) => new Set(prev).add(fqdn));
      props.onRenewed?.();
    } catch {
      // ignore
    } finally {
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
                <Button size={'sm'} colorPalette={'secondary'}>
                  DNS <ArrowRight />
                </Button>
              </HStack>
            </GridItem>
          </React.Fragment>
        );
      })}
    </Grid>
  );
};

export default DomainList;
