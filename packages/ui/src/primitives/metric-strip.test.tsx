import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Metric, MetricStrip } from "./metric-strip";

describe("MetricStrip", () => {
  it("pairs each label with its value as a described term", () => {
    render(
      <MetricStrip>
        <Metric label="Balance" value="$248.55" />
      </MetricStrip>,
    );
    // The label is wrapped for truncation, so assert the term it belongs to.
    expect(screen.getByText("Balance").closest("dt")).not.toBeNull();
    expect(screen.getByText("$248.55").tagName).toBe("DD");
  });

  // axe's `definition-list` rule allows only dt, dd, script, template and div
  // as direct children of a dl. The hint is a second dd for this reason: a <p>
  // between the terms is a violation, and it was one.
  it("puts only permitted elements directly inside the dl", () => {
    const { container } = render(
      <MetricStrip>
        <Metric label="Spend" value="$12.00" hint="This month" />
        <Metric label="Runs" value="41" />
      </MetricStrip>,
    );
    const dl = container.querySelector("dl") as HTMLElement;
    const permitted = new Set(["DT", "DD", "SCRIPT", "TEMPLATE", "DIV"]);
    for (const child of Array.from(dl.children)) {
      expect(permitted).toContain(child.tagName);
    }
  });

  it("renders the hint as a dd rather than a paragraph", () => {
    render(
      <MetricStrip>
        <Metric label="Spend" value="$12.00" hint="Personal wallet" />
      </MetricStrip>,
    );
    const hint = screen.getByText("Personal wallet");
    expect(hint.tagName).toBe("DD");
  });

  it("omits the hint entirely when not given", () => {
    const { container } = render(
      <MetricStrip>
        <Metric label="Runs" value="41" />
      </MetricStrip>,
    );
    expect(container.querySelectorAll("dd")).toHaveLength(1);
  });

  // `attention` means a person has to do something, so it shows a pill next to
  // the label. A zero on its own is not attention.
  it("shows a pill beside the label only when attention is set", () => {
    const { rerender, container } = render(
      <MetricStrip>
        <Metric label="Balance" value="$0.00" />
      </MetricStrip>,
    );
    expect(container.querySelector("svg")).toBeNull();

    rerender(
      <MetricStrip>
        <Metric
          attention={{ tone: "danger", label: "Empty" }}
          label="Balance"
          value="$0.00"
        />
      </MetricStrip>,
    );
    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("raises the value's tone only for a danger attention", () => {
    const { container } = render(
      <MetricStrip>
        <Metric
          attention={{ tone: "danger", label: "Empty" }}
          label="Balance"
          value="$0.00"
        />
      </MetricStrip>,
    );
    const value = screen.getByText("$0.00");
    expect(value.className).toContain("--surface-danger-text");
    expect(container.querySelectorAll("dd")).toHaveLength(1);
  });

  // The divider is drawn only where it belongs, never drawn and then
  // suppressed: `border-l` alongside `border-l-0` variants puts both in one
  // conflict group whose winner is decided by emitted-rule order, and that
  // resolved the wrong way at every breakpoint — every item kept a left border,
  // including the first in each row.
  it("draws the divider without a suppressing counterpart", () => {
    const { container } = render(
      <MetricStrip>
        <Metric label="Balance" value="$0.00" />
      </MetricStrip>,
    );
    const item = (container.querySelector("dl") as HTMLElement)
      .children[0] as HTMLElement;
    expect(item.className).not.toContain("border-l-0");
  });

  // The row-start test has to name the same column count the grid does, at each
  // breakpoint. Nothing in the type system ties them together, so changing the
  // grid to three columns without moving the divider puts a rule mid-row. Read
  // both out of the rendered classes and require them to agree, so the coupling
  // is enforced rather than only described.
  it("keeps the divider's row-start test matching the grid's column count", () => {
    const { container } = render(
      <MetricStrip>
        <Metric label="Balance" value="$0.00" />
      </MetricStrip>,
    );
    const dl = container.querySelector("dl") as HTMLElement;
    const item = dl.children[0] as HTMLElement;

    // `grid-cols-N` unprefixed is the base breakpoint; `<bp>:grid-cols-N` is that
    // breakpoint. The divider spells the same breakpoints as `max-<bp>:` / `<bp>:`.
    const columnsAt = (prefix: string) => {
      const re = prefix
        ? new RegExp(`(?:^| )${prefix}:grid-cols-(\\d+)(?: |$)`)
        : /(?:^| )grid-cols-(\d+)(?: |$)/;
      const m = dl.className.match(re);
      return m ? Number(m[1]) : null;
    };
    const modulusAt = (prefix: string) => {
      const m = item.className.match(
        new RegExp(`(?:^| )${prefix}:\\[&:not\\(:nth-child\\((\\d+)n\\+1\\)\\)\\]:border-l(?: |$)`),
      );
      return m ? Number(m[1]) : null;
    };

    // base grid (below sm) is guarded by the `max-sm:` divider rule
    expect(modulusAt("max-sm")).toBe(columnsAt(""));
    // the `sm:` grid is guarded by the `sm:` divider rule
    expect(modulusAt("sm")).toBe(columnsAt("sm"));

    // Every grid-cols breakpoint the strip declares must have a divider rule.
    const declared = [...dl.className.matchAll(/(?:^| )(?:([a-z]+):)?grid-cols-\d+(?= |$)/g)]
      .map((m) => m[1] ?? "");
    for (const bp of declared) {
      const guard = bp === "" ? "max-sm" : bp;
      expect(
        modulusAt(guard),
        `grid-cols at "${bp || "base"}" has no matching ${guard}: divider rule`,
      ).not.toBeNull();
    }
  });

  it("titles the hint too, so a truncated qualifier stays recoverable", () => {
    render(
      <MetricStrip>
        <Metric
          hint="Personal wallet (0x1234abcd5678efgh)"
          label="Balance"
          value="$248.55"
        />
      </MetricStrip>,
    );
    expect(screen.getByText("Personal wallet (0x1234abcd5678efgh)")).toHaveAttribute(
      "title",
      "Personal wallet (0x1234abcd5678efgh)",
    );
  });

  it("titles a string value so a truncated figure stays readable", () => {
    render(
      <MetricStrip>
        <Metric label="Balance" value="$1,284,003.10" />
      </MetricStrip>,
    );
    expect(screen.getByText("$1,284,003.10")).toHaveAttribute(
      "title",
      "$1,284,003.10",
    );
  });
});
