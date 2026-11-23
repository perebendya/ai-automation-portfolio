# Dariia Kukla · AI Automation & Internal Tools

I build tools for people who spend part of their day repeating the same task. At OBRIO (Genesis), I worked with growth, recruiting, and operations teams. I’m based in Kyiv and open to hybrid work in Kyiv or remote roles.

## Building subscription funnels from Figma with AI agents

I built an internal MCP platform that the growth team used daily to build and update subscription funnels. Starting from a Figma design, an AI agent could assemble a draft from reusable quiz screens and paywalls, connect the screens, and flag missing assets or offer details for the team to fill in.

The platform checked that each route led to an existing screen. The team could review the draft on staging and approve it for production. I also built a localization module that preserved prices and placeholders, and fixed a retry issue that could create a duplicate funnel after a timeout.

[Читати кейс українською](CASES.md#funnels)

## Recruiting search in plain language

I built a recruiting tool end to end, from importing spreadsheet records and updating profiles to the search interface. A recruiter could ask for product managers who had changed companies in the past 90 days. The tool used filters for the date range, pgvector for semantic matching, and a follow-up question when a request was ambiguous. I checked the results against queries supplied by recruiters and handed the tool over after staging tests.

[Читати кейс українською](CASES.md#search)

## Weekly reporting with n8n

A manager used to read moderation alerts across Slack channels and write a report every week. I built an n8n workflow that collected the alerts and replies, removed duplicates, and calculated the metrics in JavaScript. Claude drafted the narrative for the manager to review. If Claude was unavailable, the manager still received the metrics and moderator comments.

[Читати кейс українською](CASES.md#report)

## Personal project · AI Rental Assistant

My Telegram bot ranks apartment listings against my preferences. This small, runnable example shows how the text-ranking step handles a match, a contradiction, and missing information. It uses three synthetic listings and runs offline with Python 3.

```sh
python3 rental_demo.py
```

The first listing scores **+6** for a bed, permission to keep pets, and a gas stove. The listing that mentions only a gas stove scores **+1**. Each result includes a breakdown by preference.

[View the ranking code](rental_demo.py) · [Connect on LinkedIn](https://www.linkedin.com/in/dariia-kukla)
