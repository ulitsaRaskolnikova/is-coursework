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
import { createZone } from '~/api/services/domain-order';

type Props = {
  onCreated?: () => void | Promise<void>;
};

const CreateZoneDialog = ({ onCreated }: Props) => {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [zonePrice, setZonePrice] = useState('');

  const handleCreateZone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = zoneName.trim();
    const price = Number(zonePrice);

    if (!name || Number.isNaN(price)) {
      setCreateError('Введие корректное имя и(или) цену.');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      await createZone({ name, price });
      setZoneName('');
      setZonePrice('');
      if (onCreated) {
        await onCreated();
      }
    } catch {
      setCreateError('Не удалось создать зону. Попробуйте снова');
    } finally {
      setIsCreating(false);
    }
  };

  const isSubmitDisabled =
    isCreating ||
    !zoneName.trim() ||
    !zonePrice.trim() ||
    Number.isNaN(Number(zonePrice));

  return (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button colorPalette={'secondary'} size={'sm'}>
          Создать зону
        </Button>
      </DialogTrigger>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать зону</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form id="create-zone-form" onSubmit={handleCreateZone}>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>Название зоны</Field.Label>
                  <Input
                    placeholder="example.goip.com"
                    value={zoneName}
                    onChange={(event) => setZoneName(event.target.value)}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Цена</Field.Label>
                  <Input
                    type="number"
                    min={30}
                    step="0.01"
                    value={zonePrice}
                    onChange={(event) => setZonePrice(event.target.value)}
                  />
                </Field.Root>
                {createError && (
                  <Text color={'fg.error'} fontSize={'sm'}>
                    {createError}
                  </Text>
                )}
              </Stack>
            </form>
          </DialogBody>
          <DialogFooter>
            <DialogCloseTrigger asChild>
              <Button variant={'ghost'}>Отменить</Button>
            </DialogCloseTrigger>
            <Button
              colorPalette={'accent'}
              type={'submit'}
              form="create-zone-form"
              loading={isCreating}
              disabled={isSubmitDisabled}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default CreateZoneDialog;
