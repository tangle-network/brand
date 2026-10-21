import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "./hover-card";

describe("HoverCard", () => {
  it("shows the trigger and hides content until hovered", () => {
    render(
      <HoverCard>
        <HoverCardTrigger>@noa</HoverCardTrigger>
        <HoverCardContent>
          <HoverCardHeader>
            <HoverCardTitle>Noa</HoverCardTitle>
            <HoverCardDescription>Housekeeping · es</HoverCardDescription>
          </HoverCardHeader>
        </HoverCardContent>
      </HoverCard>,
    );
    expect(screen.getByText("@noa")).toBeVisible();
    // Portal content only renders when open
    expect(screen.queryByText("Noa")).toBeNull();
  });

  it("renders with a custom className on content", () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>hover me</HoverCardTrigger>
        <HoverCardContent className="w-80" data-testid="card">
          <p>Content</p>
        </HoverCardContent>
      </HoverCard>,
    );
    const card = screen.getByTestId("card");
    expect(card).toBeInTheDocument();
    expect(card.className).toContain("w-80");
  });
});

describe("Breadcrumb", () => {
  it("renders a trail with links and a terminal page", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/ws-1">Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/ws-1/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Connections</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
    expect(screen.getByText("Workspace")).toHaveAttribute("href", "/ws-1");
    expect(screen.getByText("Connections")).toHaveAttribute("aria-current", "page");
  });

  it("separates crumbs with chevrons by default", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/a">A</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>B</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const separators = screen.getAllByRole("presentation", { hidden: true });
    expect(separators.length).toBeGreaterThanOrEqual(1);
  });
});
