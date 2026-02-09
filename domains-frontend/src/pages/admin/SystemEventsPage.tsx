import { Grid, GridItem, Heading, Stack, Text } from '@chakra-ui/react';
import DateText from '~/components/DateText';

const SystemEventsPage = () => {
  return (
    <Stack>
      <Heading>События</Heading>
      <Grid
        templateColumns={'auto 1fr auto'}
        rowGap={2}
        columnGap={5}
        bg={'accent.muted'}
        p={5}
        borderRadius={'md'}
        alignItems={'center'}
      >
        <GridItem>
          <Text fontWeight={'bold'}>пользователь</Text>
        </GridItem>
        <GridItem>
          <Text fontWeight={'bold'}>действие</Text>
        </GridItem>
        <GridItem>
          <Text fontWeight={'bold'}>дата</Text>
        </GridItem>

        <GridItem>ivan@zinch.me</GridItem>
        <GridItem>покупка домена some.godns.pw</GridItem>
        <GridItem>
          <DateText>{new Date()}</DateText>
        </GridItem>
      </Grid>
    </Stack>
  );
};

export default SystemEventsPage;
