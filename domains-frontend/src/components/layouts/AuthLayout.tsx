import { Stack } from '@chakra-ui/react';
import { Outlet } from 'react-router';

const AuthLayout = () => {
  return (
    <Stack
      height={'100dvh'}
      justifyContent={'center'}
      alignItems={'center'}
      bg={'secondary.subtle'}
    >
      <Stack p={10} bg={'bg'} borderRadius={'md'} minW={'40em'} gap={5}>
        <Outlet />
      </Stack>
    </Stack>
  );
};

export default AuthLayout;
