import { Button, Heading, Stack } from '@chakra-ui/react';
import { KeyRound } from 'lucide-react';
import React from 'react';

const TFAWebAuthnPage = () => {
  return (
    <Stack>
      <Heading>Пройдите аутентификацию при помощи PassKey</Heading>
      <Button colorPalette={'secondary'}>
        <KeyRound /> Аутентифицироваться
      </Button>
    </Stack>
  );
};

export default TFAWebAuthnPage;
