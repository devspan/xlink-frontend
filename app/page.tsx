import Bridge from '../components/Bridge';
import { Box } from '@chakra-ui/react';

export default function Home() {
  return (
    <Box as="main" minH="100vh" bg="gray.50" py={12}>
      <Bridge />
    </Box>
  );
}