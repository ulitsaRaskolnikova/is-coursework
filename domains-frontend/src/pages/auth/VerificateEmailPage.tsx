import { Stack, Heading, Spinner, VStack, Text } from '@chakra-ui/react';
import type { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { verifyEmail } from '~/api/services/auth';

const VerificateEmailPage = () => {
  const [param, _] = useSearchParams();
  const token = param.get('token');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError(
        'Проверка не удалась. Ссылка может быть недействительной или истекшим сроком действия.'
      );
      setLoading(false);
      return;
    }

    verifyEmail({ token: token })
      .then(() => {
        navigate('/auth/sign-in?success');
      })
      .catch((e: AxiosError<{ message: string }>) => {
        setError(
          e?.response?.data?.message ??
            'Проверка не удалась. Ссылка может быть недействительной или истекшим сроком действия.'
        );
        setLoading(false);
      });
  }, [navigate, token]);

  return (
    <Stack>
      <Heading>Подтверждение адреса электронной почты</Heading>
      {loading ? (
        <VStack mt={4}>
          <Spinner color={'secondary.solid'} size={'lg'} />
        </VStack>
      ) : (
        <>
          <Text>Мы не смогли подтвердить ваш адрес электронной почты.</Text>
          <Text>{error}</Text>
        </>
      )}
    </Stack>
  );
};

export default VerificateEmailPage;
