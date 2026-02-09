import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import AppLink from '../AppLink';
import { Outlet, useNavigate } from 'react-router';
import { getAccessToken, getRefreshToken, setTokens } from '~/utils/authTokens';
import { refreshToken as apiRefreshToken } from '~/api/services/auth';
import { useStores } from '~/store';
import { isCurrentUserAdmin } from '~/utils/jwtUtils';
import { Shield } from 'lucide-react';

const AppLayout = () => {
  const navigate = useNavigate();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { userStore } = useStores();
  const { fetchMe } = userStore;

  useEffect(() => {
    let isActive = true;

    const ensureAuth = async () => {
      const accessToken = getAccessToken();
      if (accessToken) {
        setIsAuthReady(true);
        return;
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        navigate('/');
        setIsAuthReady(true);
        return;
      }

      try {
        const response = await apiRefreshToken({ refreshToken });
        const nextAccessToken = response?.data?.accessToken;
        const nextRefreshToken = response?.data?.refreshToken ?? refreshToken;

        if (!nextAccessToken) {
          navigate('/');
          setIsAuthReady(true);
          return;
        }

        setTokens({ access: nextAccessToken, refresh: nextRefreshToken });
        fetchMe();
        setIsAuthReady(true);
      } catch {
        if (isActive) {
          navigate('/');
        }
        setIsAuthReady(true);
      }
    };

    ensureAuth();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  if (!isAuthReady) {
    return (
      <Stack height="100dvh" alignItems="center" justifyContent="center">
        <Spinner color={'secondary.solid'} size={'lg'} />
      </Stack>
    );
  }

  return (
    <Grid
      height={'100dvh'}
      templateColumns={'auto 1fr'}
      templateRows={'auto 1fr'}
    >
      <GridItem>
        <Heading fontSize={30} p={5} bg={'accent.subtle'}>
          <AppLink to="/app">Хрофорс Домены</AppLink>
        </Heading>
      </GridItem>
      <GridItem>
        <HStack
          bg={'accent.muted'}
          width={'100%'}
          height={'100%'}
          px={5}
          justifyContent={'flex-end'}
          alignItems={'center'}
          gap={4}
        >
          {isCurrentUserAdmin() && (
            <Button
              size={'sm'}
              colorPalette={'red'}
              variant={'subtle'}
              onClick={() => navigate('/admin')}
            >
              <Shield size={16} /> Админ-панель
            </Button>
          )}
          <AppLink to={'/app/me'}>пользователь</AppLink>
          <Button
            size={'sm'}
            variant={'ghost'}
            onClick={() => {
              setTokens({ access: '', refresh: '' });
              navigate('/');
            }}
          >
            Выйти
          </Button>
        </HStack>
      </GridItem>
      <GridItem>
        <Stack height={'100%'} width={'100%'} bg={'accent.muted'} p={5}>
          <AppLink to={'/app/domains'}>Домены</AppLink>
          <AppLink to={'/app/dns'}>DNS</AppLink>
          <AppLink to={'/app/cart'}>Корзина</AppLink>
          <AppLink to={'/app/events'}>События</AppLink>
        </Stack>
      </GridItem>
      <GridItem>
        <Box width={'100%'} height={'100%'} overflow={'auto'} p={5}>
          <Outlet />
        </Box>
      </GridItem>
    </Grid>
  );
};

export default AppLayout;
