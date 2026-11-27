# Dariia Kukla · AI automation engineer

I build tools for people doing repetitive work. At OBRIO, that meant helping the growth team ship subscription funnels and helping recruiters search profiles in their own words.

[Українською](CASES.md) · [Interactive portfolio](https://perebendya.github.io/ai-automation-portfolio/?lang=en) · [LinkedIn](https://www.linkedin.com/in/dariia-kukla)

## From a Figma design to a live subscription funnel

I built an MCP platform the growth team used daily. An AI agent turned a Figma design into a working funnel, including the quiz, navigation and paywall.

- **Before release** — automated checks caught broken screen links and missing translation mappings.
- **In production** — the team walked through the tested funnel, approved it and published it. They could use the same platform to update it later.

<details>
<summary>See a fictional funnel from design to release</summary>

![A design for a reading quiz becomes a connected quiz and subscription paywall, then reaches production after testing and approval.](funnel-example.png)

</details>

## Candidate search in plain language

I built the recruiter tool end to end, from importing and updating profiles to the search interface. A recruiter could ask for people who recently changed jobs and had worked on onboarding.

- **Eligibility** — exact filters narrowed the pool by criteria such as when someone changed jobs.
- **Ranking** — pgvector ranked the remaining profiles by the meaning of their experience. I checked search results with recruiters using their own queries.

## Weekly moderation report in n8n

I automated the weekly review of Slack alerts. JavaScript merged duplicates and counted cases. Claude summarized moderator comments and reviewed unmarked text and audio alerts for possible false positives.

**What the manager received.** A Friday–Thursday report with four sections. Here is a shortened first-week example from the runnable demo, using fictional messages.

- **Text** — two alerts triggered on possible contact details. One was a paint colour marked as a false positive. One duplicate was excluded.
- **Audio** — a moderator reported repeated words in a transcript. The report counted one technical issue.
- **Photo** — a handwritten colour code looked like a contact number. The moderator logged an edge case.
- **Expert blocks** — one user blocked an expert. The alert gave no reason.

[Run the report and change a moderator reaction](https://perebendya.github.io/ai-automation-portfolio/report.html) · [Download the n8n workflow](https://perebendya.github.io/ai-automation-portfolio/weekly-report.json)

## AI Rental Assistant

I built a Telegram bot that checks rental listings against a request in the renter’s own words. It collects listings from three sources and uses Gemini to inspect the photos.

**“I need a double bed.”** A sofa-only flat can drop out of the shortlist. If the bed is out of frame and the description says nothing, the bot drafts a question for the owner.

[Try the photo demo](https://perebendya.github.io/ai-automation-portfolio/rental.html?lang=en) · [Bot source and screenshots](https://github.com/perebendya/ai-rental-assistant) · [Python ranking example](rental_demo.py)

The demo uses generated apartment photos to avoid republishing real listings. It uses prepared observations and includes two extra preferences you can try — kitchen colours and wall rugs.

<a id="projects"></a>

## Other work

<a id="growth"></a>

<details>
<summary><strong>Growth engineering</strong> · localization, releases and experiments</summary>

- **Localization** — built Python and Colab tools to merge reviewed copy, preserve prices and placeholders, and reuse translations across funnels.
- **Safe retries** — checked whether a timed-out write had succeeded before retrying, preventing duplicate funnels.
- **Experiments** — assembled quiz, paywall and upsell variants. Checked prices, right-to-left layouts and tracking events before rollout.
- **Handover** — wrote launch guides for funnels and documented the triggers and outputs of HR workflows and Slack apps.

</details>

<a id="operations"></a>

<details>
<summary><strong>Recruiting, support and HR</strong> · tools and integrations</summary>

- **Shared sourcing app** — contributed read-only monitoring views, role-based access and clearer profile-change notifications.
- **Grafana and Slack** — proposed a dashboard for profile changes and set up alerts for updates that needed attention.
- **Jira and Zendesk** — reopened linked support tickets when engineering closed an issue, with the outcome attached.
- **HR workflows** — restored onboarding, offboarding and peer-review integrations after a migration.
- **Benefits requests** — built the n8n step that checks a request against policy and gives the approver a reasoned recommendation.
- **Employee Slack apps** — maintained recognition, merchandise and celebration tools. Added anniversary rewards and manager reminders.

</details>

<a id="analytics"></a>

<details>
<summary><strong>Analytics and research</strong> · events, experiments and staffing</summary>

- **Product analytics** — specified iOS, Android and web events and worked through test scenarios with QA.
- **Employee recognition** — analysed managers’ usage in Python and presented the findings to HR.
- **Subscription experiment** *(training)* — compared conversion and revenue in DuckDB and investigated a spike in session length.
- **Staffing forecast** *(training)* — estimated coverage by weekday and hour from marketplace demand and repeat chats.
- **Discovery** — researched expert discovery in a marketplace and career-change signals for recruiters.

</details>

<a id="independent"></a>

<details>
<summary><strong>Independent and client projects</strong> · teaching, browser tools and apps</summary>

- **Math tutor** — used lesson history to generate worksheets and answer keys. Prototyped interactive homework and skill tracking.
- **Chrome extension** — grouped tabs by tool and tested the classification rules.
- **Job-search tracker** — built a local app that tracks the furthest interview stage separately from the outcome.
- **Grocery search** — built a ChatGPT plugin on an existing grocery MCP service to compare prices and promotions.
- **Client website** — delivered a commissioned two-page portfolio.

</details>

<a id="university"></a>

<details>
<summary><strong>University projects</strong> · recommendations and data analysis</summary>

- **Board-game recommendations** — combined adaptive questions with learning to rank for my System Analysis degree.
- **Board-game catalogue** — designed a PostgreSQL database, indexes and analytical queries. Modelled game localization as an ontology in separate coursework.
- **Marketing spend** — compared acquisition costs, revenue and return in Python and proposed a budget shift.
- **Graph analysis** — compared centrality measures and identified communities in a generated network.

</details>
