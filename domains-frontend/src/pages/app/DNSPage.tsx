import {
  Accordion,
  Box,
  Button,
  createListCollection,
  Field,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  InputGroup,
  Portal,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react';

const DNSPage = () => {
  const frameworks = createListCollection({
    items: [
      { label: 'hello.zom.com', value: 'hello.zom.com' },
      { label: 'omg.com.com', value: 'omg.com.com' },
      { label: 'why.me.co', value: 'why.me.co' },
      { label: 'not.my.domain.com', value: 'not.my.domain.com' },
    ],
  });

  const DNSTypes = createListCollection({
    items: [
      { label: 'A', value: 'a' },
      { label: 'AAAA', value: 'aaaa' },
      { label: 'SOA', value: 'soa' },
      { label: 'CNAME', value: 'cname' },
      { label: 'TXT', value: 'txt' },
      { label: 'MX', value: 'mx' },
      { label: 'SRV', value: 'srv' },
      { label: 'CAA', value: 'caa' },
    ],
  });

  return (
    <Stack>
      <Heading>DNS</Heading>
      <Select.Root collection={frameworks}>
        <Select.HiddenSelect />
        <Select.Label>Выберите домен</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Выберите домен" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {frameworks.items.map((framework) => (
                <Select.Item item={framework} key={framework.value}>
                  {framework.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <HStack justifyContent={'flex-end'}>
        <Button size={'sm'} colorPalette={'secondary'}>
          изменить DNS-сервера
        </Button>
      </HStack>

      <Accordion.Root multiple>
        <Accordion.Item value={'1'}>
          <Accordion.ItemTrigger>
            <Text>Добавить запись</Text>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <Stack bg={'accent.muted'} p={5} borderRadius={'md'}>
                <HStack gap={5}>
                  <Field.Root>
                    <Field.Label>Название</Field.Label>
                    <InputGroup endAddon=".goip.pw">
                      <Input placeholder="введите название записи" bg={'bg'} />
                    </InputGroup>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Тип</Field.Label>
                    <Select.Root collection={DNSTypes}>
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger bg={'bg'}>
                          <Select.ValueText placeholder="Выберите домен" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {DNSTypes.items.map((type) => (
                              <Select.Item item={type} key={type.value}>
                                {type.label}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Field.Root>
                </HStack>
                <Field.Root>
                  <Field.Label>Значение</Field.Label>
                  <Input placeholder="введите значение записи" bg={'bg'} />
                </Field.Root>
                <Box>
                  <Button colorPalette={'secondary'} size={'sm'}>
                    добавить
                  </Button>
                </Box>
              </Stack>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value={'2'}>
          <Accordion.ItemTrigger>
            <Text>Записи</Text>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <Stack bg={'accent.muted'} p={5} borderRadius={'md'}>
                <Accordion.Root multiple>
                  <Accordion.Item value={'domain1'}>
                    <Accordion.ItemTrigger>
                      <Text>@</Text>
                      <Accordion.ItemIndicator />
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                      <Accordion.ItemBody>
                        <Stack bg={'bg'} p={3} borderRadius={'md'}>
                          <Grid gap={2} templateColumns={'auto 1fr auto'}>
                            <GridItem>A</GridItem>
                            <GridItem>5.153.135.4</GridItem>
                            <GridItem>
                              <Button size={'xs'} colorPalette={'red'}>
                                удалить
                              </Button>
                            </GridItem>

                            <GridItem>TXT</GridItem>
                            <GridItem>gasvfcda</GridItem>
                            <GridItem>
                              <Button size={'xs'} colorPalette={'red'}>
                                удалить
                              </Button>
                            </GridItem>
                          </Grid>
                        </Stack>
                      </Accordion.ItemBody>
                    </Accordion.ItemContent>
                  </Accordion.Item>

                  <Accordion.Item value={'domain2'}>
                    <Accordion.ItemTrigger>
                      <Text>www</Text>
                      <Accordion.ItemIndicator />
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                      <Accordion.ItemBody>
                        <Stack bg={'bg'} p={3} borderRadius={'md'}>
                          <Grid gap={2} templateColumns={'auto 1fr auto'}>
                            <GridItem>A</GridItem>
                            <GridItem>5.153.135.4</GridItem>
                            <GridItem>
                              <Button size={'xs'} colorPalette={'red'}>
                                удалить
                              </Button>
                            </GridItem>

                            <GridItem>TXT</GridItem>
                            <GridItem>gasvfcda</GridItem>
                            <GridItem>
                              <Button size={'xs'} colorPalette={'red'}>
                                удалить
                              </Button>
                            </GridItem>
                          </Grid>
                        </Stack>
                      </Accordion.ItemBody>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                </Accordion.Root>
              </Stack>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
};

export default DNSPage;
