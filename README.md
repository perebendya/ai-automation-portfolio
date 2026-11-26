# Dariia Kukla · AI Automation & Internal Tools

At OBRIO (Genesis), I built a platform for creating subscription funnels, a search tool for recruiters, and a weekly reporting workflow. I work with AI agents, n8n, Python, and PostgreSQL. Based in Kyiv, open to hybrid work in Kyiv or remote roles.

[Українською](CASES.md) · [Browse all projects by area](#projects)

## Building subscription funnels from Figma with AI agents

I built an MCP platform the growth team used daily to turn Figma designs into working subscription funnels. The agent generated the funnel JSON, built quiz screens and paywalls, and wired up navigation. Automated tests checked screen transitions and translation keys. The growth team then walked through the funnel on staging, approved it and released it to production.

![Fictional reading subscription. The live funnel lets readers choose a daily goal, view their reading plan and open the paywall. The release path runs from Figma through automated tests, staging review and team approval to production.](funnel-example.png)

I also built localization into the platform so the team could reuse reviewed translations across funnels.

[Українською · конструктор воронок](CASES.md#funnels)

## Recruiting search in plain language

Recruiters kept profiles in spreadsheets and tracked job changes by hand. I built the tool end to end, from importing and updating profiles to a search interface that combined exact filters with semantic matching in PostgreSQL.

**Sample search using fictional data**

> Find product managers who changed companies in the last 90 days and have worked on onboarding.

The time window is a filter. Onboarding experience is a match by meaning. A fictional result might read **Profile A · changed companies 42 days ago · redesigned the first-run experience for new subscribers**. A profile that moved 120 days ago falls outside the window, however relevant its experience.

I used sample queries from recruiters to check whether the results matched their expectations. After staging tests, I handed the tool and documentation to the team.

[Українською · пошук для рекрутерів](CASES.md#search)

## Weekly reporting with n8n

[Run the weekly report in your browser](https://perebendya.github.io/ai-automation-portfolio/report.html) · [Download the n8n workflow](https://perebendya.github.io/ai-automation-portfolio/weekly-report.json)

A manager used to read moderation alerts and replies across Slack channels to write a weekly report. I built an n8n workflow that gathered the alerts, removed duplicates, and counted them in JavaScript. Claude drafted the summary for review.

During the pilot, the manager told me they still checked every alert that had no response. I added a separate review of those alerts so the manager could see which ones might be false positives.

> **Example report · fictional data**
>
> 12 unique alerts this week. Moderators responded to 9. Of the 3 with no response, 1 was flagged as a possible false positive for review.

If the model was unavailable, the workflow still delivered the counts and the moderators’ comments. The manager could finish the report with the evidence already collected.

[Українською · щотижневий звіт](CASES.md#report)

## Personal project · AI Rental Assistant

[Bot source, offline run and screenshots](https://github.com/perebendya/ai-rental-assistant)

[**Try the apartment photo demo**](https://perebendya.github.io/ai-automation-portfolio/rental.html?lang=en)

I built a Telegram bot that collects rental listings from OLX, DIM.RIA and Telegram groups. Renters describe what they want in their own words. The bot distinguishes requirements from preferences and combines listing details with Gemini’s photo observations. If a double bed is essential and the only sleeping option is a sofa, the bot can rule the flat out. If neither the listing nor the photos show where you would sleep, it can add that question to a draft message for the owner.

In the demo, type a request and check the results against four photos per flat. Wall rugs and kitchen colours are examples I added for the portfolio. The bot itself checks stove type, sleeping arrangements, usable tables and bathroom condition.

I generated photos of three fictional flats for the public demo so I could show the assistant at work without republishing anyone’s listing photos. This also let me illustrate a distinction that matters in a rental search. One photo clearly shows a rug above the bed. Another shows only kitchen cabinets, so the assistant leaves the wall-rug preference unresolved for that flat.

The Telegram bot uses Gemini to inspect listing photos. The browser demo uses prepared observations and adds two visual preferences for kitchen colours and wall rugs. [Python text-ranking example](rental_demo.py) · [Connect on LinkedIn](https://www.linkedin.com/in/dariia-kukla)

<a id="projects"></a>

## More projects and contributions

[Growth engineering](#growth) · [Recruiting, support and people operations](#operations) · [Analytics and research](#analytics) · [Independent and client projects](#independent) · [University projects](#university)

<a id="growth"></a>

### Growth engineering

#### Localization that survives a copy edit

A proofreader’s edit should change the words on a paywall and leave the price and dynamic fields intact. I built Python and Colab tools to merge reviewed translations, check those fields, and reuse approved copy across funnels. That workflow became part of the funnel platform.

#### Retrying a funnel update safely

An update could time out after the change had already gone live. I worked on the retry logic so that trying again would first check whether the change had been applied. This prevented a retry from creating a second copy of a funnel.

#### Launching and testing subscription journeys

I assembled quizzes, paywalls and upsells, configured experiment variants and rolled out the selected versions. My launch checks included following a visitor from a campaign landing page to the offer, checking localized prices and right-to-left layouts, and verifying tracking events along the way.

#### Guides for the next operator

I wrote launch guides covering screens, offers and translation keys. I also documented HR automations and Slack apps so a colleague taking over a workflow could trace what triggered it and where its output went.

<a id="operations"></a>

### Recruiting, support and people operations

#### Contributing to a shared sourcing app

Alongside the search tool I built, I contributed to a team-owned sourcing application. I worked on read-only monitoring views, access by role and clearer notifications about changes to a profile.

#### Turning a notification stream into a dashboard

I proposed a Grafana dashboard for profile updates and set up targeted alerts. Recruiters could look up changes in one place and use Slack for updates that needed attention.

#### Handing a resolved issue back to support

Closing an engineering issue left support with a separate follow-up to remember. I built a Jira–Zendesk automation that reopened the linked support tickets and added the engineering outcome. Support could see whether a fix was ready or the issue had been closed for another reason.

#### Keeping HR workflows running through a migration

I maintained n8n workflows for onboarding, offboarding and peer reviews. After the HR system and Slack setup changed, I repaired the affected integrations and documented the handoffs for the people team.

#### An explained first pass on benefit requests

I built the LLM review step for a benefits workflow in n8n. It checked a request against policy and gave the approver a suggested decision with a reason. I handed this step over for review.

#### Maintaining employee-facing Slack apps

I audited and extended existing apps for recognition, merchandise requests and celebrations. My changes included anniversary rewards and reminders that prompted managers when it was time to act.

<a id="analytics"></a>

### Analytics and research

#### Making product events comparable across platforms

I wrote event specifications for iOS, Android and web, translated them into implementation tasks and worked with QA on test scenarios. Developers and testers had a common description of the user action each event represented.

#### How managers used a recognition program

HR wanted to understand how managers used a peer recognition tool. I analysed usage in Python and turned the results into charts and a presentation for the HR team.

#### Reading a subscription experiment · training exercise

I used SQL in DuckDB to compare conversion, revenue per user and revenue per paying user. A spike in session duration stood out in the distribution, so I examined it as a diagnostic alongside the headline metrics.

#### Forecasting marketplace staffing · training exercise

I analysed demand by weekday and hour, examined repeat chat activity, and used the forecast to estimate when more experts would be needed. The output was a staffing recommendation for the exercise.

#### Product and recruiting research

I investigated two discovery problems: how users find experts in a marketplace and which career changes are informative to a sourcing team. My contribution was research into the questions, separate from implementation.

<a id="independent"></a>

### Independent and client projects

#### A math tutor that remembers the last lesson

I built a workflow for my tutoring practice that uses a lesson log to select what to revisit and which problems to try next. The agent creates fresh exercises, solves them for checking and produces a student worksheet plus a separate answer key. I use the local workflow for PDF and Miro materials. I also prototyped interactive homework and progress by skill, then paused the web version when generation hit its quota.

#### Grouping browser tabs in one click

I built a Chrome extension that groups open tabs by tool. It applies the same rules each time and has tests for how tabs are classified.

#### A personal job-search tracker

I designed and use a local tracker for comparing roles and following applications. It distinguishes the furthest interview stage from the outcome, so a rejection still leaves a record of how far an application progressed.

#### A grocery search plugin

I assembled a personal ChatGPT plugin on top of an existing grocery MCP service. It lets me search the catalogue and compare prices and promotions from a chat.

#### A portfolio website for a client

I built a two-page portfolio website on commission. My deliverable was the client’s website.

<a id="university"></a>

### University projects

#### Recommending board games with adaptive questions

For my bachelor’s project in System Analysis, I combined adaptive questions with learning to rank. Each answer helped refine the ordering of board games for the player.

#### Modelling a board-game catalogue

In separate coursework I designed a PostgreSQL database for a board-game club, including indexes and analytical queries. I also modelled board-game localization as an ontology.

#### Comparing marketing spend in Python

I visualized acquisition costs, revenue per user and return on investment, then proposed a budget reallocation as part of a course assignment.

#### Exploring networks with graph analysis

In a Python lab I generated a graph, visualized its structure and compared different measures of node centrality. I then looked for communities to see how the local groups related to the overall network.
