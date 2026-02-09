import { Table } from '@chakra-ui/react';
import React, { type ReactNode } from 'react';
import type { DomainQuery } from '~/api/models/DomainQuery';
import DomainRow from './DomainRow';

type Props = {
  domains: DomainQuery[];
  buttonsFunction?: (domain: DomainQuery) => ReactNode;
};

const DomainsTable = (props: Props) => {
  return (
    <Table.Root striped tableLayout="fixed" width="100%">
      <Table.Caption />
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader fontWeight={'bold'} width="60%">
            Домен
          </Table.ColumnHeader>
          <Table.ColumnHeader fontWeight={'bold'} width="20%">
            Цена
          </Table.ColumnHeader>
          <Table.ColumnHeader width="20%" />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {props.domains.map((domain) => (
          <DomainRow
            key={domain.fqdn}
            domain={domain}
            buttonsFunction={props.buttonsFunction}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default DomainsTable;
