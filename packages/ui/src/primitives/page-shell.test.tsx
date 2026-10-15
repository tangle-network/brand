import { render,screen } from "@testing-library/react";
import { describe,it,expect } from "vitest";
import { PageShell } from "./page-shell";
import { PageHeader } from "./page-header";
import { Button } from "./button";
describe("shared reading frame",()=>{
 it("keeps one article with named navigation and outline",()=>{
  render(<PageShell navigation={<a href="#start">Start</a>} article={<PageHeader title="Guide" presentation="operational"/>} outline={<a href="#start">On this page</a>}/>);
  expect(screen.getAllByRole("article")).toHaveLength(1);expect(screen.getByRole("navigation",{name:"Sections"})).toBeInTheDocument();expect(screen.getByRole("complementary",{name:"On this page"})).toBeInTheDocument();expect(screen.getAllByRole("heading",{level:1})).toHaveLength(1);
 });
 it("keeps display CTA opt-in and its native disabled behavior",()=>{
  render(<Button size="display" disabled>Get API key</Button>);expect(screen.getByRole("button")).toBeDisabled();expect(screen.getByRole("button")).toHaveClass("tangle-control-display");
 });
});
