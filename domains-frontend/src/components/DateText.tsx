import { Text } from '@chakra-ui/react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { type JSX } from 'react';

type Props = {
  children: string | Date | Dayjs;
  as?: string | (() => JSX.Element);
};

const DateText = (props: Props) => {
  const date = dayjs(props.children);
  const format = dayjs().year() === date.year() ? 'DD MMMM' : 'DD MMM YYYY';
  const dateText = date.locale('ru').format(format);

  if (props.as) {
    return React.createElement(props.as, null, dateText);
  }

  return <Text>{dateText}</Text>;
};

export default DateText;
