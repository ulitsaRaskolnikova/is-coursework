import {
  Button,
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
  Field,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Fragment, useCallback, useEffect, useState, type FormEvent } from 'react';
import { AXIOS_INSTANCE } from '~/api/apiClientDomains';

interface L2Domain {
  id?: number;
  name: string;
}

const ZonesPage = () => {
  const [zones, setZones] = useState<L2Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  /* create dialog state */
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadZones = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await AXIOS_INSTANCE.get<L2Domain[]>('/l2Domains');
      setZones(data ?? []);
    } catch {
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    setCreateError('');
    try {
      await AXIOS_INSTANCE.post('/l2Domains', { name });
      setNewName('');
      await loadZones();
    } catch {
      setCreateError('Не удалось создать зону');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    setDeletingName(name);
    try {
      await AXIOS_INSTANCE.delete(`/l2Domains/${encodeURIComponent(name)}`);
      await loadZones();
    } catch {
      // ignore
    } finally {
      setDeletingName(null);
    }
  };

  return (
    <Stack gap={5}>
      <HStack justifyContent={'space-between'}>
        <Heading>Зоны 2-го уровня</Heading>
        <HStack>
          <Text>{zones.length} зон</Text>

          {/* Create dialog */}
          <DialogRoot>
            <DialogTrigger asChild>
              <Button colorPalette={'secondary'} size={'sm'}>Создать зону</Button>
            </DialogTrigger>
            <DialogBackdrop />
            <DialogPositioner>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать зону</DialogTitle>
                </DialogHeader>
                <DialogBody>
                  <form id="create-zone-form" onSubmit={handleCreate}>
                    <Stack gap={4}>
                      <Field.Root required>
                        <Field.Label>Название зоны</Field.Label>
                        <Input
                          placeholder="example.com"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                        />
                      </Field.Root>
                      {createError && <Text color={'fg.error'} fontSize={'sm'}>{createError}</Text>}
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
                    loading={creating}
                    disabled={creating || !newName.trim()}
                  >
                    Создать
                  </Button>
                </DialogFooter>
              </DialogContent>
            </DialogPositioner>
          </DialogRoot>
        </HStack>
      </HStack>

      {loading ? (
        <HStack><Spinner size={'sm'} /><Text>Загрузка...</Text></HStack>
      ) : zones.length === 0 ? (
        <Text color={'fg.muted'}>Нет зон</Text>
      ) : (
        <Grid
          templateColumns={'1fr auto'}
          rowGap={2}
          bg={'accent.muted'}
          alignItems={'center'}
          px={5}
          py={2.5}
          borderRadius={'sm'}
        >
          <GridItem><Text fontWeight={'bold'}>Зона</Text></GridItem>
          <GridItem />

          {zones.map((zone) => (
            <Fragment key={zone.name}>
              <GridItem><Text>{zone.name}</Text></GridItem>
              <GridItem>
                <HStack justifyContent={'flex-end'}>
                  <Button
                    size={'xs'}
                    colorPalette={'red'}
                    onClick={() => handleDelete(zone.name)}
                    loading={deletingName === zone.name}
                    disabled={deletingName !== null && deletingName !== zone.name}
                  >
                    удалить
                  </Button>
                </HStack>
              </GridItem>
            </Fragment>
          ))}
        </Grid>
      )}
    </Stack>
  );
};

export default ZonesPage;
