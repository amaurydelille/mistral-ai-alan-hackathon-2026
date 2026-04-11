# vital.

> Your personal health coach that actually knows you — powered by the data already in your pocket.

## Team

| Name | LinkedIn Profile Link |
| ---- | --------------------- |
| Arthur Lefebvre      |   https://www.linkedin.com/in/arthur-lefebvre-fr/                    |
| Amaury Delille     |   https://www.linkedin.com/in/amaurydelille/                    |
|      |                       |

## The Problem

95% of health apps are built for athletes. But most people — especially the knowledge workers, startup employees, and young professionals that Alan insures — don't need a training plan. They need someone to tell them their body is heading toward burnout *before* they feel it.

The average sedentary knowledge worker sits 10+ hours a day, sleeps less than 7 hours, and has a wearable that collects data they never act on. The result: preventable burnout, GP visits for stress-related complaints, and sick leave that costs €5K–15K per case.

Existing solutions fail this user in one of three ways:
- **Generic advice** ("drink more water") that isn't grounded in actual data (Noom, Lark Health)
- **Athlete-first design** that's irrelevant to the 95% who don't train (Whoop, Fitbit, ONVY)
- **Hardware dependency** that limits reach to people who are already health-conscious (Apple Coach, Whoop)

## What It Does

vital. is an AI-powered health coach that connects to your wearable data and turns 14+ days of biometric signals into a daily, personalized health conversation.

**Smart Onboarding** — A 2-minute natural conversation where Mistral builds your health profile. No forms, no dropdowns. The LLM extracts structured data (age, goals, constraints, lifestyle patterns) directly from what you say. Feels like talking to a personal trainer, not filling out a medical questionnaire.

**Daily Overview** — Every morning, a coach briefing written by Mistral synthesizing yesterday's sleep, heart rate, activity, and 7-day trends. Two cards: what's notable vs. your usual baseline, and one specific action to take today. Three metric cards (sleep, resting HR, active calories) with 14-day sparklines. Sleep debt tracked in a signal strip alongside recovery, insomnia, and mental health scores.

**Body Forecast** — A 3-day risk projection using HRV decline, sleep debt accumulation, and resting HR trends. When risk is elevated, Mistral generates a personalized rescue plan. Each forecast day gets an AI-written reason grounded in the user's specific numbers. *Nobody else tells you what's coming — every other app only tells you what happened.*

**Cardiovascular Load** — Proxy stroke risk score computed from RHR elevation above baseline and sleep debt. Surfaces as an InsightCard when the signal is meaningful, with a plain-language explanation of what the data means.

**What If** — Ask hypothetical questions answered against your own history. "What if I drink tonight?" → "Based on your data, alcohol on high-stress days drops your deep sleep by 40%. Last time this happened..." The only AI coach that reasons about your *future* using your *past*.

**Promises** — Health commitments you make to yourself, evaluated daily against real biometric data by Mistral. A sleep promise checks your actual sleep duration; an abstract promise ("no caffeine after 4pm") gets a coaching verdict. Broken promises surface a specific gap: "You slept 5h30 instead of 7h. That's 90min short." The daily briefing on the overview is personalized around your active promises.

A user interaction flows like this:
1. Onboarding chat → Mistral extracts your health profile in natural language
2. Overview loads → 3 parallel Mistral calls generate alert headline, daily briefing, and 3-day forecast from the same biometric context
3. Check your promises → each card calls Mistral's evaluate endpoint to determine kept vs. broken status
4. Ask "What if I stay up late tonight?" → conditional reasoning over your personal trend data
5. Tomorrow: check what changed and make your next promise

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion (`motion/react`) |
| AI / LLM | Mistral 🚀 (`mistral-large-latest`) — structured JSON extraction, narrative generation, evaluation, what-if reasoning |
| Health Data | Thryve 🚀 — `/v5/dailyDynamicValues` aggregating Withings (sleep stages, RHR, HR zones, burned calories, stroke risk scores) |
| Database | Supabase (goals / promises persistence) |
| Deployment | Vercel |

**How Mistral is used:**
- **Onboarding**: function-calling style structured extraction — LLM converts a free-form conversation into a typed `UserProfile` JSON object
- **Overview**: 3 parallel calls with the same biometric context, different editorial frames — alert headline (terse, urgent), daily briefing (narrative + insight + action tip), forecast reasons (temporal reasoning over 3 days)
- **Promise evaluation**: per-goal Mistral call comparing actual metric values to target, generating a coaching verdict with sentiment and a 1-sentence accountability message
- **What If**: multi-step conditional reasoning — the LLM receives 14 days of history and a hypothetical, then reasons through the likely impact on sleep, HRV, next-day recovery, and 3-day forecast
- **Goal suggestion**: LLM analyzes trends and generates 3 ranked promise suggestions grounded in the user's weakest signals

## Special Track

Are you submitting to a special track? If so, which one?

- [ ] Alan Play: Living Avatars
- [ ] Alan Play: Mo Studios
- [ ] Alan Play: Personalized Wrapped
- [x] Alan Play: Health App in a Prompt
- [x] Alan Precision

## What We'd Do Next

**Prove It — Personal Correlation Engine**
Mine the user's own data to find correlations specific to them. "On days when you have caffeine after 15h, your deep sleep drops 18 minutes — this happened 8 out of 11 times." Generic advice is boring. *Your* caffeine after 3pm costs *you* 18 minutes of deep sleep, here are the 8 nights that prove it — that's undeniable.

**Twin Compare — Anonymous Cohort Benchmarking**
Compare your metrics against people with the same profile (age, job, lifestyle) using Alan's member base. "Your 5h40 sleep puts you in the bottom 15% of 28-32 year olds in tech. People with your profile who improved to 7h+ saw stress scores drop 1.2 points in 3 weeks." This feature is impossible without an insurer partner — it's the moat.

**Continuous Sync**
Replace the demo's static snapshot with live wearable webhooks. Thryve supports push notifications; vital. could refresh its context in real time as new data arrives from the user's device.

**French-Language Mode**
All Mistral prompts localised to French for the Alan member base. Mistral's French-language quality is a genuine competitive advantage over GPT-4-based competitors locked to English-first models.

**Alan Integration**
Surface vital. inside the Alan app as a native module. Alan's daily engagement + vital.'s coaching loop = the retention flywheel neither product has alone. First intervention signal: cross-reference biometric trends with claims data to flag burnout risk before it becomes a sick leave request.
