import { createElement as h } from "react";
import { Button, Input, Card } from "@tangle-network/ui/primitives";

export function Fixture() {
  return h(Card, null,
    h(Input, { "aria-label": "Packed input", defaultValue: "Packed value" }),
    h(Button, null, "Packed button"),
  );
}
