import { Button, Heading, Stack } from '@chakra-ui/react';
import { Clock, KeyRound } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router';

const TFAPage = () => {
  const navigate = useNavigate();

  return (
    <Stack>
      <Heading>Выберите метод двухфакторной аутентификации</Heading>
      <Button colorPalette={'accent'} onClick={() => navigate('totp')}>
        <Clock />
        TOTP
      </Button>
      <Button colorPalette={'accent'} onClick={() => navigate('webauthn')}>
        <KeyRound /> Passkey
      </Button>
    </Stack>
  );
};

export default TFAPage;
