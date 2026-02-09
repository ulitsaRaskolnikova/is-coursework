import { Button, Field, Input, Stack, Text } from '@chakra-ui/react';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@chakra-ui/react';
import { useState, type FormEvent } from 'react';
import type { TwoFactorSetupResponse } from '~/api/models/auth';
import { enable2FA, generateSetup } from '~/api/services/auth';

type Props = {
  onEnabled?: () => void | Promise<void>;
};

const EnableTwoFactorDialog = ({ onEnabled }: Props) => {
  const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOpen = async () => {
    setError('');
    setSuccess('');
    if (setup || isLoadingSetup) return;

    setIsLoadingSetup(true);
    try {
      const response = await generateSetup();
      setSetup(response?.data ?? null);
    } catch {
      setError('Не удалось получить настройки 2FA. Попробуйте еще раз.');
    } finally {
      setIsLoadingSetup(false);
    }
  };

  const handleEnable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const secret = setup?.secret ?? setup?.manualEntryKey;
    if (!secret) {
      setError('Настройки 2FA не найдены. Попробуйте еще раз.');
      return;
    }

    if (!code.trim()) {
      setError('Введите корректный код.');
      return;
    }

    setIsEnabling(true);
    try {
      await enable2FA({ secret, code: code.trim() });
      setSuccess('Двухфакторная аутентификация включена.');
      setCode('');
      if (onEnabled) {
        await onEnabled();
      }
    } catch {
      setError('Не удалось включить 2FA. Попробуйте еще раз.');
    } finally {
      setIsEnabling(false);
    }
  };

  const isSubmitDisabled = isEnabling || !code.trim() || isLoadingSetup;

  return (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button colorPalette={'secondary'} size={'sm'} onClick={handleOpen}>
          Подключить
        </Button>
      </DialogTrigger>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Включить 2FA</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form id="enable-2fa-form" onSubmit={handleEnable}>
              <Stack gap={4}>
                {isLoadingSetup ? (
                  <Text>Загрузка настроек...</Text>
                ) : (
                  <>
                    {setup?.qrCodeUrl && (
                      <img src={setup.qrCodeUrl} alt="2FA QR code" />
                    )}
                    <Field.Root>
                      <Field.Label>Ключ настройки</Field.Label>
                      <Input
                        readOnly
                        value={setup?.manualEntryKey ?? setup?.secret ?? ''}
                      />
                    </Field.Root>
                    <Field.Root required>
                      <Field.Label>Код</Field.Label>
                      <Input
                        inputMode="numeric"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                      />
                    </Field.Root>
                  </>
                )}
                {error && (
                  <Text color={'fg.error'} fontSize={'sm'}>
                    {error}
                  </Text>
                )}
                {success && (
                  <Text color={'fg.success'} fontSize={'sm'}>
                    {success}
                  </Text>
                )}
              </Stack>
            </form>
          </DialogBody>
          <DialogFooter>
            <DialogCloseTrigger asChild>
              <Button variant={'ghost'}>Закрыть</Button>
            </DialogCloseTrigger>
            <Button
              colorPalette={'accent'}
              type={'submit'}
              form="enable-2fa-form"
              loading={isEnabling}
              disabled={isSubmitDisabled}
            >
              Включить
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default EnableTwoFactorDialog;
