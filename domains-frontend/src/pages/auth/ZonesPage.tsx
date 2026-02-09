import { Grid, GridItem, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import type { Zone } from '~/api/models/domain-order';
import { getAllZones } from '~/api/services/domain-order';
import CreateZoneDialog from '~/components/admin/zones/CreateZoneDialog';
import ManageZoneDialog from '~/components/admin/zones/ManageZoneDialog';

const ZonesPage = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadZones = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllZones({
        pageable: {
          page: 0,
          size: 50,
        },
      });
      setZones(response?.data?.content ?? []);
    } catch {
      setZones([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  return (
    <Stack gap={5}>
      <HStack justifyContent={'space-between'}>
        <Heading>Зоны 2-го уровня</Heading>
        <HStack>
          <Text>{zones.length} зон</Text>
          <CreateZoneDialog onCreated={loadZones} />
        </HStack>
      </HStack>
      {isLoading ? (
        <Text>Загрузка...</Text>
      ) : (
        <Grid
          templateColumns={'40% 20% auto'}
          rowGap={2}
          bg={'accent.muted'}
          alignItems={'center'}
          px={5}
          py={2.5}
          borderRadius={'sm'}
        >
          <GridItem>
            <Text fontWeight={'bold'}>Зона</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight={'bold'}>Цена</Text>
          </GridItem>
          <GridItem />
          {zones.map((zone) => (
            <Fragment key={zone.id ?? zone.name}>
              <GridItem>
                <Text>{zone.name ?? '-'}</Text>
              </GridItem>
              <GridItem>
                <Text>{`${zone.price ?? '-'} рублей / месяц`}</Text>
              </GridItem>
              <GridItem>
                <HStack justifyContent={'flex-end'}>
                  <ManageZoneDialog zone={zone} onUpdated={loadZones} />
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
