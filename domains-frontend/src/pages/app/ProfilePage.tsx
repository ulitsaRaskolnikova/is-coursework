import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { get2FAStatus } from '~/api/services/auth';
import EnableTwoFactorDialog from '~/components/app/profile/EnableTwoFactorDialog';
import { useStores } from '~/store';

const ProfilePage = observer(() => {
  const { userStore } = useStores();
  const { user } = userStore;

  const [tfaStatus, setTfaStatus] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    get2FAStatus().then((status) => setTfaStatus(Boolean(status.data)));
  }, []);

  return (
    <Stack>
      <Heading>Профиль</Heading>
      <Grid templateColumns={'1fr 1fr'} maxW={'70%'} gap={5}>
        <GridItem>
          <Text mb={4}>Данные</Text>
          <Stack bg={'accent.muted'} p={5} borderRadius={'md'} gap={5}>
            <HStack justifyContent={'space-between'}>
              <Text fontWeight={'bold'}>Email</Text>
              <Text>{user?.email ?? '??'}</Text>
            </HStack>
            {/* <Box>
              <ChangePassword />
            </Box> */}
          </Stack>
        </GridItem>
        <GridItem>
          <Text mb={4}>2FA</Text>
          <Stack bg={'accent.muted'} p={5} borderRadius={'md'} gap={5}>
            {tfaStatus === undefined && (
              <VStack height={'100%'} py={5}>
                <Spinner />
              </VStack>
            )}
            {tfaStatus === true && (
              <>
                <HStack justifyContent={'space-between'}>
                  <Text fontWeight={'bold'}>Подключена 2FA по TOTP</Text>
                </HStack>
                <Box>
                  <Button colorPalette={'secondary'} size={'sm'}>
                    отключить
                  </Button>
                </Box>
              </>
            )}
            {tfaStatus === false && (
              <>
                <Text fontWeight={'bold'}>2FA не подключена</Text>
                <EnableTwoFactorDialog onEnabled={() => setTfaStatus(true)} />
              </>
            )}
          </Stack>
        </GridItem>
        <GridItem>
          <HStack>
            {/* <Button colorPalette={'secondary'}>Выйти</Button> */}
            {/* <Button colorPalette={'red'}>Удалить аккаунт</Button> */}
          </HStack>
        </GridItem>
      </Grid>
    </Stack>
  );
});

export default ProfilePage;
