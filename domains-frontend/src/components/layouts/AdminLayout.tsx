import {
  Box,
  Grid,
  GridItem,
  Heading,
  HStack,
  Spinner,
  Stack,
} from '@chakra-ui/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import AppLink from '../AppLink';
import { Outlet, useNavigate } from 'react-router';
import { refreshToken as apiRefreshToken } from '~/api/services/auth';
import { getAccessToken, getRefreshToken, setTokens } from '~/utils/authTokens';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (navRef.current?.style.width)
      navRef.current.style.width = headerRef.current?.offsetWidth
        ? `${headerRef.current?.offsetWidth}px`
        : 'auto';
  }, []);

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
        <Heading fontSize={30} p={5} bg={'accent.subtle'} ref={headerRef}>
          <AppLink to="/admin">Хрофорс Домены</AppLink>
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
        >
          <AppLink to={'/admin/me'}>администратор</AppLink>
        </HStack>
      </GridItem>
      <GridItem>
        <Stack height={'100%'} width={'100%'} bg={'accent.muted'} p={5}>
          <AppLink to={'/admin/domains'}>Домены</AppLink>
          <AppLink to={'/admin/users'}>Пользователи</AppLink>
          <AppLink to={'/admin/finances'}>Финансы</AppLink>
          <AppLink to={'/admin/events'}>События</AppLink>
          <AppLink to={'/admin/zones'}>Зоны</AppLink>
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

export default AdminLayout;
