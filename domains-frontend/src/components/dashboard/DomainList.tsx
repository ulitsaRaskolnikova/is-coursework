import React from 'react';
import type { DomainResponse } from '../../api/models';
import { Button, Grid, GridItem, HStack, Stack, Text } from '@chakra-ui/react';
import DateText from '../DateText';
import { ArrowRight } from 'lucide-react';

type Props = {
  domains: DomainResponse[];
};

const DomainList = (props: Props) => {
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
      {props.domains.map((domain) => (
        <React.Fragment key={domain.id}>
          <GridItem key={domain.id}>
            <Text>{domain.fqdn}</Text>
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
              <Button size={'sm'} colorPalette={'secondary'}>
                продлить
              </Button>
              <Button size={'sm'} colorPalette={'secondary'}>
                DNS <ArrowRight />
              </Button>
            </HStack>
          </GridItem>
        </React.Fragment>
      ))}
    </Grid>
  );
};

export default DomainList;
