# Dariia Kukla · AI Automation & Internal Tools

I build tools for people who spend part of their day repeating the same task. At OBRIO (Genesis), I worked with growth, recruiting, and operations teams. I’m based in Kyiv and open to hybrid work in Kyiv or remote roles.

## A platform for managing subscription funnels

I built an internal Model Context Protocol (MCP) platform that the growth team used daily to manage changes to subscription funnels. An AI agent could prepare a targeted edit, the platform could validate it, and a teammate could approve it before it reached production. The platform kept an audit trail of changes.

One problem surfaced when a production write timed out. The change could already be live even though the agent saw an error. I fixed the retry behavior so a second attempt would not create a duplicate funnel. Localization was one module of the same platform. It preserved prices and placeholders and let the team reuse reviewed translations across domains.

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
