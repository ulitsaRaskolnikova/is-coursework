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
import { useEffect, useState, type FormEvent } from 'react';
import type { Zone } from '~/api/models/domain-order';
import { deleteZone, updateZone } from '~/api/services/domain-order';

type Props = {
  zone: Zone;
  onUpdated?: () => void | Promise<void>;
};

const ManageZoneDialog = ({ zone, onUpdated }: Props) => {
  const [price, setPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPrice(zone.price === undefined ? '' : String(zone.price));
    setError('');
  }, [zone.id, zone.price]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!zone.id) {
      setError('Зона не найдена.');
      return;
    }

    const nextPrice = Number(price);
    if (Number.isNaN(nextPrice)) {
      setError('Введите корректную цену.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await updateZone(zone.id, { price: nextPrice });
      if (onUpdated) {
        await onUpdated();
      }
    } catch {
      setError('Не удалось обновить зону. Попробуйте снова.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!zone.id) {
      setError('Зона не найдена.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await deleteZone(zone.id);
      if (onUpdated) {
        await onUpdated();
      }
    } catch {
      setError('Не удалось удалить зону. Попробуйте снова.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isSubmitDisabled =
    isSaving || isDeleting || !price.trim() || Number.isNaN(Number(price));
  const formId = `manage-zone-form-${zone.id ?? zone.name ?? 'zone'}`;

  return (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button size={'sm'} colorPalette={'secondary'}>
          управлять
        </Button>
      </DialogTrigger>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Управление зоной</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form id={formId} onSubmit={handleSave}>
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Зона</Field.Label>
                  <Text>{zone.name ?? '-'}</Text>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Цена</Field.Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </Field.Root>
                {error && (
                  <Text color={'fg.error'} fontSize={'sm'}>
                    {error}
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
              colorPalette={'red'}
              onClick={handleDelete}
              loading={isDeleting}
              disabled={isSaving}
            >
              Удалить
            </Button>
            <Button
              colorPalette={'accent'}
              type={'submit'}
              form={formId}
              loading={isSaving}
              disabled={isSubmitDisabled}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default ManageZoneDialog;
