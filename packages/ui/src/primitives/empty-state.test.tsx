import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

afterEach(cleanup);

describe("EmptyState", () => {
  it("renders the title as h3 by default", () => {
    render(<EmptyState title="No runs yet" />);
    expect(screen.getByRole("heading", { level: 3, name: "No runs yet" })).toBeTruthy();
  });

  it("uses the requested heading level", () => {
    render(<EmptyState title="No suites yet" titleAs="h2" description="Add one." />);
    expect(screen.getByRole("heading", { level: 2, name: "No suites yet" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  });
});
