import React from 'react';
import type { DomainResponse } from '../../api/models';
import {
  Badge,
  Button,
  Grid,
  GridItem,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import DateText from '../DateText';
import { ArrowRight, Proportions } from 'lucide-react';
import type { Dayjs } from 'dayjs';

type Props = {
  events: {
    id: string;
    type: 'SYSTEM' | 'USER';
    message: string;
    at: string | Date | Dayjs;
  }[];
};

const EventList = (props: Props) => {
  return (
    <Grid
      templateColumns={'auto 1fr auto'}
      gap={2}
      bg={'accent.muted'}
      alignItems={'center'}
      px={5}
      py={2.5}
      borderRadius={'sm'}
    >
      {props.events.map((event) => (
        <React.Fragment key={event.id}>
          <GridItem>
            <Badge colorPalette={'secondary'}>
              {event.type === 'SYSTEM' ? 'Система' : 'Пользователь'}
            </Badge>
          </GridItem>
          <GridItem>{event.message}</GridItem>
          <GridItem>
            <DateText>{event.at}</DateText>
          </GridItem>
        </React.Fragment>
      ))}
    </Grid>
  );
};

export default EventList;
