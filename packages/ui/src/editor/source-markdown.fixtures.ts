/**
 * Markdown fixtures for the source-preserving editor tests.
 */

/**
 * One of every block and inline construct, in the less common spellings too.
 * Trailing spaces are written as \u0020 so an editor cannot strip them.
 */
export const KITCHEN_SINK = `

# Title with \`code\` and **bold**

Setext heading
==============

Paragraph with *star emphasis*, _underscore emphasis_, __double under__, snake_case_name, a\\_b escaped,
a hard break here\u0020\u0020
and a [link](https://example.com "Title"), a [ref link][ref], <https://auto.link>, and ~~strike~~.

* star bullet one
* star bullet two
    * nested four-space

+ plus list

1) paren ordered
2) second

3. starts at three
4. four

- [ ] task open
- [x] task done

> quote line one
> > nested quote

\`\`\`ts
const x = 1 // fenced
\`\`\`

~~~
tilde fence
~~~

    indented code

***

---
___

| Left | Center | Right |
|:-----|:------:|------:|
| a | **b** | [c](https://c.example) |

<div align="center">raw html block</div>

![image alt](images/pic.png "pic title")

Text with inline <sup>html</sup> and an emoji 🚀 and trailing spaces\u0020\u0020\u0020

[ref]: https://ref.example "Ref Title"

Line with trailing backslash\\
next line
`;


/** Shaped like an agent-written competitor call sheet: headings, prose and GFM tables. */
export const CALL_SHEET = `# Plausible Analytics: competitor call sheet

**Updated:** October 11, 2026 · **Use:** establish what the buyer is comparing before positioning Plausible.

## Three deal paths

| Competitor | Why a buyer may choose it | Call response |
|---|---|---|
| Google Analytics 4 | Standard GA4 is free of charge. ([GA4](https://example.com/ga4)) | **Acknowledge:** the no-cost offer is real. |
| Fathom | Closest paid, cookie-free alternative. | Ask which reports they rely on today. |
| Simple Analytics | Stricter no-identifier model. | Show the dashboard and ask what is missing. |

## Qualifying questions

1. Which reports do you open every week?
2. Who signs off on analytics spend?

* Keep the call to 20 minutes
* Send the comparison after the call
`;
