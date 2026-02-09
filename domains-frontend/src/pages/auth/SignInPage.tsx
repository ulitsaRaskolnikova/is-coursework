import {
  Alert,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  Stack,
} from '@chakra-ui/react';
import AppLink from '../../components/AppLink';
import type { AxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { getUserById, login } from '~/api/services/auth';
import { setTokens } from '~/utils/authTokens';
import { useState } from 'react';
import { useStores } from '~/store';

const SignInPage = () => {
  const [params, _] = useSearchParams();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userStore, authStore } = useStores();

  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<{
    email: string;
    password: string;
  }>();

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await login({
        ...formData,
      });
      const accessToken = response?.data?.accessToken;
      const refreshToken = response?.data?.refreshToken;
      const userId = response?.data?.userId;

      if (!accessToken || !refreshToken || !userId) {
        setError(
          response?.message ??
            'Не удалось войти в систему. Проверьте свои учетные данные и повторите попытку.'
        );
        return;
      }

      setTokens({ access: accessToken, refresh: refreshToken });
      const user = await getUserById(userId);
      if (user.data) userStore.setUser(user.data);
      navigate('/app');
    } catch (e) {
      const apiError = e as AxiosError<{ error: { message?: string, code?: string } }>;
      if (apiError.response?.data?.error?.code === 'TOTP_REQUIRED') {
        authStore.setEmail(formData.email);
        authStore.setPassword(formData.password);
        navigate('/auth/2fa/totp');
        return;
      }
      setError(
        apiError?.response?.data?.error?.message ??
          'Не удалось войти в систему. Проверьте свои учетные данные и повторите попытку.'
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Stack>
      <Heading>Войти</Heading>

      {params.has('success') && (
        <Alert.Root status={'success'}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Учетная запись подтверждена</Alert.Title>
            <Alert.Description>
              Не удалось войти в систему. Проверьте свои учетные данные и
              повторите попытку.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <form onSubmit={onSubmit}>
        <Stack gap={3}>
          {error && (
            <Alert.Root status={'error'}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
          <Field.Root required>
            <Field.Label>
              Email <Field.RequiredIndicator />
            </Field.Label>
            <Input
              placeholder="Введите свой адрес электронной почты"
              type="email"
              {...register('email', { required: true })}
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>
              Пароль <Field.RequiredIndicator />
            </Field.Label>
            <Input
              placeholder="Введите свой пароль"
              type="password"
              {...register('password', { required: true })}
            />
          </Field.Root>
          <Button
            type={'submit'}
            colorPalette={'accent'}
            loading={isSubmitting}
          >
            Войти
          </Button>
        </Stack>
      </form>
      <HStack justifyContent={'space-between'}>
        <AppLink to={'/auth/sign-up'}>Зарегистрироваться</AppLink>
        <AppLink to={'/auth/forget-password'}>Забыли пароль</AppLink>
      </HStack>
    </Stack>
  );
};

export default SignInPage;
