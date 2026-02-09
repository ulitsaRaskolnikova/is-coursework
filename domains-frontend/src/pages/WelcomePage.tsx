import { Box, Button, HStack, Input, Stack, Text } from '@chakra-ui/react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { validateDomain } from '../utils/validateDomain';
import { $ok } from '../common/atoms';

const WelcomePage = () => {
  const [input, setInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const domains = ['.goip.pw', '.godns.pw', '.gofrom.pw'];
  const [domainIndex, setDomainIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsFading(true);
      const timeoutId = setTimeout(() => {
        setDomainIndex((prev) => (prev + 1) % domains.length);
        setIsFading(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [domains.length]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const domain = input.trim().toLocaleLowerCase();
      const [result, reason] = validateDomain(domain);
      if (result === $ok) {
        navigate(`/check-domain?q=${domain}`);
      } else {
        setError(reason);
      }
    },
    [input]
  );

  return (
    <Stack flex={1} justifyContent={'center'} alignItems={'center'}>
      <Stack
        minW={'50em'}
        bg={'accent.muted'}
        p={10}
        borderRadius={'sm'}
        gap={5}
      >
        <Text fontSize={24} fontWeight={'bold'}>
          Проверьте доступность домена
        </Text>
        <form onSubmit={handleSubmit}>
          <HStack justifyContent={'space-between'} gap={5}>
            <HStack gap={0} width={'100%'}>
              <Input
                placeholder="ваш домен"
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                bg={'bg'}
                border={'none'}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (error) setError('');
                }}
              />
              <Box
                bg={'accent.solid'}
                color={'accent.contrast'}
                p={2}
                paddingRight={4}
                borderRadius={'md'}
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                height={'2.5em'}
                width={'8.5em'}
                overflow={'hidden'}
              >
                <Box
                  opacity={isFading ? 0 : 1}
                  transition={'opacity 300ms ease'}
                >
                  {domains[domainIndex]}
                </Box>
              </Box>
            </HStack>
            <Button colorPalette={'accent'} type={'submit'}>
              Проверить
            </Button>
          </HStack>
          {error && (
            <Text fontSize={'sm'} color={'red.500'}>
              {error}
            </Text>
          )}
        </form>
      </Stack>
    </Stack>
  );
};

export default WelcomePage;
