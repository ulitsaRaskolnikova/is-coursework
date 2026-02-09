import {
  Button,
  Field,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import AppLink from '../../components/AppLink';
import { useCallback, useState, type FormEvent } from 'react';

const ForgetPasswordPage = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
    },
    [email]
  );

  return (
    <Stack>
      <Heading>Сбросить пароль</Heading>
      <Text>
        Введите свой адрес электронной почты, и мы вышлем вам ссылку для сброса
        пароля.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Field.Root required>
            <Field.Label>
              Email <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="email"
              placeholder="Введите свой адрес электронной почты"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field.Root>
          <Button type={'submit'} colorPalette={'accent'}>
            Отправить ссылку для сброса
          </Button>
        </Stack>
      </form>
      <HStack justifyContent={'flex-end'}>
        <AppLink to={'/auth/sign-in'}>Войти</AppLink>
      </HStack>
    </Stack>
  );
};

export default ForgetPasswordPage;
