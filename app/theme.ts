// theme.ts
import { extendTheme, ThemeConfig, StyleFunctionProps } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        bg: mode("gray.100", "gray.900")(props),
        color: mode("gray.800", "whiteAlpha.900")(props),
        transition: "background-color 0.2s ease",
      },
      "*::placeholder": {
        color: mode("gray.600", "gray.400")(props),
      },
      "*, *::before, &::after": {
        borderColor: mode("gray.200", "gray.700")(props),
        wordWrap: "break-word",
      },
    }),
  },
  components: {
    Badge: {
      baseStyle: (props: StyleFunctionProps) => ({
        bg: mode("gray.100", "gray.700")(props),
        color: mode("gray.800", "whiteAlpha.900")(props),
      }),
    },
    IconButton: {
      baseStyle: (props: StyleFunctionProps) => ({
        color: mode("gray.800", "whiteAlpha.900")(props),
      }),
    },
    Tooltip: {
      baseStyle: (props: StyleFunctionProps) => ({
        bg: mode("gray.100", "gray.700")(props),
        color: mode("gray.800", "whiteAlpha.900")(props),
      }),
    },
    Select: {
      baseStyle: (props: StyleFunctionProps) => ({
        field: {
          bg: mode("white", "gray.800")(props),
          color: mode("gray.800", "whiteAlpha.900")(props),
        },
      }),
    },
    Input: {
      baseStyle: (props: StyleFunctionProps) => ({
        field: {
          bg: mode("white", "gray.800")(props),
          color: mode("gray.800", "whiteAlpha.900")(props),
        },
      }),
    },
    Button: {
      baseStyle: (props: StyleFunctionProps) => ({
        bg: mode("gray.100", "gray.700")(props),
        color: mode("gray.800", "whiteAlpha.900")(props),
        _hover: {
          bg: mode("gray.200", "gray.600")(props),
        },
      }),
    },
    Table: {
      baseStyle: (props: StyleFunctionProps) => ({
        th: {
          color: mode("gray.800", "whiteAlpha.900")(props),
        },
        td: {
          color: mode("gray.800", "whiteAlpha.900")(props),
        },
      }),
    },
    ModalContent: {
      baseStyle: (props: StyleFunctionProps) => ({
        bg: mode("white", "gray.800")(props),
        color: mode("gray.800", "whiteAlpha.900")(props),
      }),
    },
    Heading: {
      baseStyle: (props: StyleFunctionProps) => ({
        color: mode("gray.800", "whiteAlpha.900")(props),
      }),
    },
  },
});

export default theme;
