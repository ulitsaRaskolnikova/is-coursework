import {
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';

const UsersPage = () => {
  return (
    <Stack>
      <Heading>Пользователи</Heading>
      <Stack bg={'accent.muted'} p={5} borderRadius={'md'}>
        <Grid
          templateColumns={'1fr auto 1fr'}
          alignItems={'center'}
          rowGap={2}
          columnGap={5}
        >
          <GridItem borderBottomColor={'border'}>
            <Text fontWeight={'bold'}>Email</Text>
          </GridItem>
          <GridItem borderBottomColor={'border'}>
            <Text fontWeight={'bold'}>кол-во доменов</Text>
          </GridItem>
          <GridItem borderBottomColor={'border'} />

          <GridItem>some@email.com</GridItem>
          <GridItem>5</GridItem>
          <GridItem>
            <HStack justifyContent={'flex-end'}>
              <Button size={'sm'} colorPalette={'secondary'}>
                редактировать
              </Button>
              <Button size={'sm'} colorPalette={'red'}>
                заблокировать
              </Button>
            </HStack>
          </GridItem>

          <GridItem>another@email.com</GridItem>
          <GridItem>7</GridItem>
          <GridItem>
            <HStack justifyContent={'flex-end'}>
              <Button size={'sm'} colorPalette={'secondary'}>
                редактировать
              </Button>
              <Button size={'sm'} colorPalette={'red'}>
                заблокировать
              </Button>
            </HStack>
          </GridItem>
        </Grid>
      </Stack>
    </Stack>
  );
};

export default UsersPage;
