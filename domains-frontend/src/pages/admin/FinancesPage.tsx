import {
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import DateText from '~/components/DateText';

const FinancesPage = () => {
  return (
    <Stack gap={5}>
      <Heading>Финансы</Heading>
      <Stack>
        <Text>Оборот за месяц: 18514 рублей</Text>
        <Text>Оборот за неделю: 1321 рублей</Text>
      </Stack>

      <Stack>
        <Text>Счета</Text>
        <Grid
          templateColumns={'auto auto auto auto auto 1fr'}
          rowGap={2}
          columnGap={5}
          bg={'accent.muted'}
          p={5}
          borderRadius={'md'}
          alignItems={'center'}
        >
          <GridItem>
            <Text fontWeight="bold">пользователь</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight="bold">операция</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight="bold">статус</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight="bold">дата</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight="bold">сумма</Text>
          </GridItem>
          <GridItem />

          <GridItem>ivain@zinch.me</GridItem>
          <GridItem>поступление(карта)</GridItem>
          <GridItem>совершена</GridItem>
          <GridItem>
            <DateText>{new Date()}</DateText>
          </GridItem>
          <GridItem>1500 рублей</GridItem>
          <GridItem>
            <HStack justifyContent={'flex-end'}>
              <Button size={'sm'} colorPalette={'red'}>
                отменить операцию
              </Button>
            </HStack>
          </GridItem>

          <GridItem>ivain@zinch.me</GridItem>
          <GridItem>поступление(карта)</GridItem>
          <GridItem>ожидание оплаты</GridItem>
          <GridItem>
            <DateText>{new Date()}</DateText>
          </GridItem>
          <GridItem>1500 рублей</GridItem>
          <GridItem>
            <HStack justifyContent={'flex-end'}>
              <Button size={'sm'} colorPalette={'secondary'}>
                пропустить оплату
              </Button>
            </HStack>
          </GridItem>
        </Grid>
      </Stack>
    </Stack>
  );
};

export default FinancesPage;
