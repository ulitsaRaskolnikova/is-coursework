import { Heading, Stack, Text } from '@chakra-ui/react';
import type { AxiosError } from 'axios';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { resendVerificationEmail } from '~/api/services/auth';
import { toaster } from '~/components/ui/toaster';
import { useStores } from '~/store';

const CheckEmailPage = observer(() => {
  const [wait, setWait] = useState(120);
  const waitText = useMemo(() => `Через ${wait} секунд`, [wait]);
  const { authStore: registrationStore } = useStores();

  const handleClick = useCallback(() => {
    if (wait > 0) return;
    resendVerificationEmail({ email: registrationStore.email })
      .then(() => {
        toaster.create({
          title: 'Отправлено подтверждающее письмо по электронной почте',
        });
      })
      .catch((e: AxiosError<{ message: string }>) => {
        toaster.create({
          title: 'Не удалось повторно отправить подтверждающее письмо',
          description: e?.response?.data?.message,
          type: 'error',
        });
      });
  }, [registrationStore.email, wait]);

  useEffect(() => {
    if (wait <= 0) return;
    const intervalId = setInterval(() => {
      setWait((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [wait]);

  return (
    <Stack>
      <Heading>Проверьте свою электронную почту</Heading>
      <Text>
        Мы отправили подтверждающую ссылку на ваш адрес электронной почты.
        Перейдите по ссылке, чтобы завершить регистрацию.
      </Text>
      <Text>
        Если вы не получили электронное письмо, вы можете запросить новое.{' '}
        <Text
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
          as={'span'}
          textDecor={'underline'}
          color={wait > 0 ? 'fg.subtle' : 'secondary.solid'}
        >
          Повторно отправить электронное письмо
        </Text>{' '}
        {waitText}.
      </Text>
      <Text>
        Проверьте папку со спамом или попробуйте снова через несколько минут,
        если письмо не пришло.
      </Text>
    </Stack>
  );
});

export default CheckEmailPage;
