import type { Preview } from "@storybook/react";
import "./storybook.css";

const THEMES = [
  { value: "dark", title: "Dark (default)" },
  { value: "light", title: "Light" },
  { value: "aubergine", title: "Aubergine" },
  { value: "aubergine-light", title: "Aubergine · light" },
  { value: "arena", title: "Arena (green)" },
  { value: "arena-light", title: "Arena · light" },
  { value: "tangle-light", title: "Tangle · light" },
] as const;

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Brand theme",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: THEMES.map((t) => ({ value: t.value, title: t.title })),
      },
    },
  },
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
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "dark";
      if (typeof document !== "undefined") {
        // Every theme (incl. dark/light) is a data-theme scope; the spine + @theme
        // layer re-skin from it. Body tracks the theme's own canvas token.
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.style.colorScheme = theme.includes("light")
          ? "light"
          : "dark";
        document.body.style.background = "var(--bg-root)";
      }
      return Story();
    },
  ],
};

export default preview;
