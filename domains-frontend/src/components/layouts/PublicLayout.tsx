import { Button, Heading, HStack, Stack } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router';
import AppLink from '../AppLink';

const PublicLayout = () => {
  const navigate = useNavigate();

  return (
    <Stack height={'100dvh'} justifyContent={'space-between'}>
      <HStack
        justifyContent="space-between"
        alignItems="center"
        px={10}
        py={5}
        bg={'bg'}
      >
        <Heading fontSize={30}>
          <AppLink to="/">Хрофорс Домены</AppLink>
        </Heading>
        <Button
          colorPalette={'accent'}
          onClick={() => navigate('/auth/sign-in')}
        >
          Войти или зарегистрироваться
        </Button>
      </HStack>
      <Outlet />
      <HStack gap={5} px={10} py={5} bg={'secondary.subtle'}>
        <AppLink to={'/todo'}>Контакты</AppLink>
        <AppLink to={'/todo'}>Политика конфиденциальности</AppLink>
        <AppLink to={'/todo'}>Правила использования</AppLink>
      </HStack>
    </Stack>
  );
};

export default PublicLayout;
