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

const UsersDomainsPage = () => {
  return (
    <Stack>
      <HStack justifyContent={'space-between'}>
        <Heading>Домены</Heading>
        <Button size={'sm'} colorPalette={'secondary'}>
          добавить
        </Button>
      </HStack>

      <Grid
        templateColumns={'1fr 1fr auto 3fr'}
        rowGap={2}
        columnGap={5}
        bg={'accent.muted'}
        p={5}
        borderRadius={'md'}
        alignItems={'center'}
      >
        <GridItem>
          <Text fontWeight={'bold'}>домен</Text>
        </GridItem>
        <GridItem>
          <Text fontWeight={'bold'}>пользователь</Text>
        </GridItem>
        <GridItem>
          <Text fontWeight={'bold'}>истекает</Text>
        </GridItem>
        <GridItem />

        <GridItem>hello.example.com</GridItem>
        <GridItem>hello@zinch.com</GridItem>
        <GridItem>
          <DateText>{new Date(2026, 1, 3)}</DateText>
        </GridItem>
        <GridItem>
          <HStack justifyContent={'flex-end'}>
            <Button size={'sm'} colorPalette={'secondary'}>
              редактировать
            </Button>
            <Button size={'sm'} colorPalette={'red'}>
              удалить
            </Button>
          </HStack>
        </GridItem>

        <GridItem>omg.example.com</GridItem>
        <GridItem>omg@zinch.com</GridItem>
        <GridItem>
          <DateText>{new Date(2026, 3, 3)}</DateText>
        </GridItem>
        <GridItem>
          <HStack justifyContent={'flex-end'}>
            <Button size={'sm'} colorPalette={'secondary'}>
              редактировать
            </Button>
            <Button size={'sm'} colorPalette={'red'}>
              удалить
            </Button>
          </HStack>
        </GridItem>
      </Grid>
    </Stack>
  );
};

export default UsersDomainsPage;
