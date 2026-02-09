import { Alert, Button, Heading, HStack, PinInput, Stack } from '@chakra-ui/react';
import type { AxiosError } from 'axios';
import { observer } from 'mobx-react-lite';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { getUserById, login } from '~/api/services/auth';
import { useStores } from '~/store';
import { setTokens } from '~/utils/authTokens';

const TFATotpPage = observer(() => {
  const [value, setValue] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authStore, userStore } = useStores();
  const { email, password } = authStore;
  const navigate = useNavigate();

  useEffect(() => {
    if (!email || !password) {
      navigate('/auth/sign-in');
    }
  }, [email, password, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const totpCode = value.join('').trim();
    if (totpCode.length !== 6) {
      setError('Введите 6-значный код.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await login({
        email,
        password,
        totpCode,
      });
      const accessToken = response?.data?.accessToken;
      const refreshToken = response?.data?.refreshToken;
      const userId = response?.data?.userId;

      if (!accessToken || !refreshToken || !userId) {
        setError(response?.message ?? 'Не удалось войти в систему. Повторите попытку.');
        return;
      }

      setTokens({ access: accessToken, refresh: refreshToken });
      authStore.setEmail('');
      authStore.setPassword('');

      try {
        const user = await getUserById(userId);
        if (user.data) userStore.setUser(user.data);
      } catch {
        // user profile load failed, but auth succeeded
      }

      navigate('/app');
    } catch (e) {
      const apiError = e as AxiosError<{ message?: string }>;
      setError(apiError?.response?.data?.message ?? 'Не удалось войти в систему. Повторите попытку.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={5}>
        <Heading>Введите 6-значный код из приложения-аутентификатора.</Heading>
        {error && (
          <Alert.Root status={'error'}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
        <HStack justifyContent={'center'}>
          <PinInput.Root
            size="xl"
            otp
            attached
            value={value}
            onValueChange={(e) => setValue(e.value)}
          >
            <PinInput.HiddenInput />
            <PinInput.Control>
              <PinInput.Input index={0} />
              <PinInput.Input index={1} />
              <PinInput.Input index={2} />
              <PinInput.Input index={3} />
              <PinInput.Input index={4} />
              <PinInput.Input index={5} />
            </PinInput.Control>
          </PinInput.Root>
        </HStack>
        <Button type={'submit'} colorPalette={'accent'} loading={isSubmitting}>
          Проверить
        </Button>
      </Stack>
    </form>
  );
});

export default TFATotpPage;
