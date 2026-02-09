import { Heading, Link, Stack } from '@chakra-ui/react';
import React from 'react';
import { Link as RLink } from 'react-router';

type Props = {
  fullPage?: boolean;
};

const NotFound = (props: Props) => {
  return (
    <Stack
      gap={2}
      justifyContent={'center'}
      height={props.fullPage ? '100dvh' : 'auto'}
      alignItems={'center'}
    >
      <Heading fontSize={'9xl'} lineHeight={0.8}>
        404
      </Heading>
      <Heading>Такой страницы не существует</Heading>
      {/* @ts-ignore */}
      <Link as={RLink} to={'/'}>
        Вернуться на главную
      </Link>
    </Stack>
  );
};

export default NotFound;
