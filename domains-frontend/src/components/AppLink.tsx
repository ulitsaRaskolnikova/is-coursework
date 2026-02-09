import { Link } from '@chakra-ui/react';
import React, { type MouseEvent, type ReactNode } from 'react';
import { useNavigate, type NavigateOptions } from 'react-router';

type Props = {
  children: ReactNode;
  to: string;
  options?: NavigateOptions;
};

const AppLink = (props: Props) => {
  const navigate = useNavigate();
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    navigate(props.to, props.options);
  };

  return <Link onClick={handleClick}>{props.children}</Link>;
};

export default AppLink;
