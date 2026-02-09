import type { ReactNode } from 'react';
import type { DomainQuery } from '../../api/models/DomainQuery';
import { Button, Table, Text } from '@chakra-ui/react';
import { getAccessToken } from '~/utils/authTokens';

type Props = {
  domain: DomainQuery;
  buttonsFunction?: (domain: DomainQuery) => ReactNode;
};

const DomainRow = (props: Props) => {
  const { domain, buttonsFunction } = props;
  const isLoggedIn = Boolean(getAccessToken());

  return (
    <Table.Row>
      <Table.Cell>{domain.fqdn}</Table.Cell>
      <Table.Cell>{domain.price}₽ / месяц</Table.Cell>
      <Table.Cell>
        {buttonsFunction ? (
          buttonsFunction(domain)
        ) : domain.free ? (
          isLoggedIn ? (
            <Button colorPalette={'secondary'}>Добавить в корзину</Button>
          ) : (
            <Text color={'green.500'} fontWeight={'bold'}>Свободен</Text>
          )
        ) : (
          <Text>Домен занят</Text>
        )}
      </Table.Cell>
    </Table.Row>
  );
};

export default DomainRow;
