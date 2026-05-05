import type { Preview } from "@storybook/react";
import "./storybook.css";

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      if (typeof document !== "undefined") {
        document.documentElement.style.colorScheme = "dark";
        document.body.style.background = "hsl(248 52% 5%)";
      }
      return Story();
    },
  ],
};

export default preview;
