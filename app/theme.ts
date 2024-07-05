import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    primary: {
      500: '#3498db',
    },
    secondary: {
      500: '#2ecc71',
    },
    accent: {
      500: '#f39c12',
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#1a202c' : '#f8f9fa',
        color: props.colorMode === 'dark' ? '#e2e8f0' : '#2d3748',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        _focus: {
          boxShadow: 'none',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          _focus: {
            borderColor: 'primary.500',
            boxShadow: '0 0 0 1px #3498db',
          },
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          _focus: {
            borderColor: 'primary.500',
            boxShadow: '0 0 0 1px #3498db',
          },
        },
      },
    },
  },
});

export default theme;