import { Button, Field, Input, Stack, Text } from '@chakra-ui/react';
import {
  DialogActionTrigger,
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

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isMismatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword !== confirmPassword;

  const isSubmitDisabled =
    !currentPassword || !newPassword || !confirmPassword || isMismatch;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button colorPalette={'secondary'} size={'sm'}>
          Сменить пароль
        </Button>
      </DialogTrigger>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Смена пароля</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>Текущий пароль</Field.Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Новый пароль</Field.Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Field.Root>
                <Field.Root required invalid={isMismatch}>
                  <Field.Label>Повторите новый пароль</Field.Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Field.Root>
                {isMismatch && (
                  <Text color={'fg.error'} fontSize={'sm'}>
                    Пароли не совпадают
                  </Text>
                )}
              </Stack>
            </form>
          </DialogBody>
          <DialogFooter>
            <DialogCloseTrigger asChild>
              <Button variant={'ghost'}>Отмена</Button>
            </DialogCloseTrigger>
            <DialogActionTrigger asChild>
              <Button
                colorPalette={'accent'}
                type={'submit'}
                form="change-password-form"
                disabled={isSubmitDisabled}
              >
                Сохранить
              </Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default ChangePassword;
