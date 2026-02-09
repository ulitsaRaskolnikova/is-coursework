import {
  Alert,
  Button,
  Checkbox,
  Field,
  Heading,
  HStack,
  Input,
  Link,
  Stack,
} from '@chakra-ui/react';
import AppLink from '../../components/AppLink';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { register as apiRegister } from '~/api/services/auth';
import { useState } from 'react';
import { useStores } from '~/store';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authStore: registrationStore } = useStores();

  const { register, handleSubmit, getValues } = useForm<{
    email: string;
    password: string;
    confirmPassword: string;
    policyAccepted: boolean;
    marketingAccepted: boolean;
  }>();

  const onSubmit = handleSubmit(async (data) => {
    const email = data.email.trim().toLowerCase();
    setIsSubmitting(true);
    setError('');

    try {
      await apiRegister({
        email,
        password: data.password,
      });
      registrationStore.setEmail(email);
      navigate('/auth/check-email', { state: { email } });
    } catch (e) {
      const apiError = e as AxiosError<{ message?: string }>;
      setError(
        apiError?.response?.data?.message ??
          'Не удалось зарегистрироваться. Проверьте данные и попробуйте снова.'
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Stack gap={5}>
      <Heading>Регистрация</Heading>
      <form onSubmit={onSubmit}>
        <Stack gap={4}>
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
              placeholder="Введите email"
              type="email"
              {...register('email', { required: true })}
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>
              Пароль <Field.RequiredIndicator />
            </Field.Label>
            <Input
              placeholder="Придумайте пароль"
              type="password"
              {...register('password', { required: true })}
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>
              Подтверждение пароля <Field.RequiredIndicator />
            </Field.Label>
            <Input
              placeholder="Повторите пароль"
              type="password"
              {...register('confirmPassword', {
                required: true,
                validate: (value) => value === getValues('password'),
              })}
            />
          </Field.Root>

          <Checkbox.Root colorPalette={'accent'}>
            <Checkbox.HiddenInput
              {...register('policyAccepted', { required: true })}
            />
            <Checkbox.Control />
            <Checkbox.Label>
              Я принимаю условия сервиса и политику конфиденциальности.{' '}
              <Link href="" target="_blank">
                Условия
              </Link>
            </Checkbox.Label>
          </Checkbox.Root>
          <Checkbox.Root colorPalette={'accent'}>
            <Checkbox.HiddenInput
              {...register('marketingAccepted', { required: true })}
            />
            <Checkbox.Control />
            <Checkbox.Label>
              Хочу получать маркетинговые рассылки.{' '}
              <Link href="" target="_blank">
                Политика рассылок
              </Link>
            </Checkbox.Label>
          </Checkbox.Root>

          <Button
            type={'submit'}
            colorPalette={'accent'}
            loading={isSubmitting}
          >
            Создать аккаунт
          </Button>
        </Stack>
      </form>
      <HStack justifyContent={'space-between'}>
        <AppLink to={'/auth/sign-in'}>Вход</AppLink>
      </HStack>
    </Stack>
  );
};

export default SignUpPage;
