import { Button, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router';

const PaymentFailPage = () => {
  const navigate = useNavigate();

  return (
    <Stack minHeight={'100dvh'} alignItems={'center'} justifyContent={'center'}>
      <Stack
        maxW={'560px'}
        width={'100%'}
        bg={'accent.muted'}
        borderRadius={'lg'}
        p={8}
        gap={4}
      >
        <Heading size={'lg'}>Платеж не прошел</Heading>
        <Text color={'fg.muted'}>
          Оплата не была завершена. Проверьте данные карты или попробуйте снова.
        </Text>
        <HStack gap={3} flexWrap={'wrap'}>
          <Button colorPalette={'secondary'} onClick={() => navigate('/app/cart')}>
            Вернуться в корзину
          </Button>
          <Button variant={'subtle'} onClick={() => navigate('/app/domains')}>
            К моим доменам
          </Button>
        </HStack>
      </Stack>
    </Stack>
  );
};

export default PaymentFailPage;
