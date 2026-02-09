import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';

const AdminDashboardPage = () => {
  return (
    <Stack gap={5}>
      <Heading>Админ-панель</Heading>
      <HStack gap={5}>
        <Stack>
          <Text fontWeight={'bold'}>Кол-во пользователей</Text>
          <Stack
            width={'12em'}
            bg={'accent.muted'}
            borderRadius={'md'}
            py={5}
            alignItems={'center'}
          >
            <Text>1135</Text>
          </Stack>
        </Stack>

        <Stack>
          <Text fontWeight={'bold'}>Кол-во доменов</Text>
          <Stack
            width={'12em'}
            bg={'accent.muted'}
            borderRadius={'md'}
            py={5}
            alignItems={'center'}
          >
            <Text>115</Text>
          </Stack>
        </Stack>

        <Stack>
          <Text fontWeight={'bold'}>Оборот за неделю</Text>
          <Stack
            width={'12em'}
            bg={'accent.muted'}
            borderRadius={'md'}
            py={5}
            alignItems={'center'}
          >
            <Text>1555 рублей</Text>
          </Stack>
        </Stack>

        <Stack>
          <Text fontWeight={'bold'}>Оборот за месяц</Text>
          <Stack
            width={'12em'}
            bg={'accent.muted'}
            borderRadius={'md'}
            py={5}
            alignItems={'center'}
          >
            <Text>15550 рублей</Text>
          </Stack>
        </Stack>
      </HStack>

      <Stack alignItems={'flex-start'}>
        <Text fontWeight={'bold'}>Отчёт</Text>
        <HStack width={'30em'}>
          <Text>С</Text>
          <Input type={'date'} />
          <Text>по</Text>
          <Input type={'date'} />
        </HStack>
        <Button colorPalette={'accent'}>Составить отчёт</Button>
      </Stack>
    </Stack>
  );
};

export default AdminDashboardPage;
