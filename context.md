# Hackathon Brief: AI Lifestyle Coach for Sedentary Knowledge Workers

## Context & Judges

- **Hackathon partners:** Mistral (LLM provider) + Alan (French health insurance)
- **Time constraint:** 10 hours
- **What Alan cares about:** Prevention over treatment, reducing unnecessary care costs, member engagement, mental health, simplicity. Their members are mostly young tech/startup workers in France.
- **What Mistral cares about:** Seeing their models used well — smart prompting, structured data extraction, agentic patterns, multi-turn reasoning, function calling, French-language quality.

---

## The Idea

**An AI-powered lifestyle and fitness coach for people who don't work out enough** — powered by real biometric + behavioral data, distributed through a health insurer (Alan).

**One-liner:** "Your personal health coach that actually knows you — powered by the data already in your pocket."

**Refined pitch:** "Not a coach for athletes. A coach for the other 95% — the people Alan actually insures."

---

## Why This Idea

### The gap in the market

Every competitor either:
1. Targets athletes/fitness enthusiasts (Whoop, Fitbit, Garmin, ONVY, Athlytic, Cora, Vora)
2. Gives generic advice not grounded in real data (Noom, old Lark Health consumer product)
3. Is locked behind expensive proprietary hardware (Whoop = $30/month strap, Fitbit = Google Pixel, Apple Coach = Apple Watch only)
4. Has no distribution partner and dies from customer acquisition costs

**Positioning map:**

|                          | Data-grounded (real biometrics) | Generic (quiz/template-based) |
|--------------------------|--------------------------------|-------------------------------|
| **For athletes/fit**     | Whoop, Fitbit, ONVY, Athlytic  | Most fitness apps             |
| **For sedentary/prevention** | **US (empty space)**       | Noom, Lark (struggled here)   |

We sit in the bottom-left quadrant. Nobody is building a data-grounded, LLM-powered prevention coach for people who don't work out, distributed through an insurer.

### Validation

- Apple is building "Apple Coach" for iOS 19 — same concept, validates the market
- Lark Health raised $185M and pivoted from consumer to B2B (selling to insurers) — proves insurers will pay
- Noom raised $1.4B but is dying because generic coaching doesn't retain users — proves data grounding matters
- Whoop Coach works but only for athletes with a $30/month device — proves conversational AI on biometric data works
- AI captured 60% of all digital health funding for the first time in 2025
- 6 new unicorns in digital health in Q1 2025 alone

---

## Who Tried Before & Why They Failed

### Dead

- **Forward** ($400M raised, shut down Nov 2024): AI health kiosks in malls. Hardware too expensive, couldn't get subscribers to cover costs. Lesson: stay software-only.
- **Cydoc** (bootstrapped, shut down Aug 2025): Great health AI platform but no sales co-founder, no distribution. Product didn't sell itself. Lesson: distribution > tech. Alan IS your distribution.
- **Olive** ($1B raised, shut down Oct 2023): Overpromised AI to hospitals not ready. Built for hype cycle, not real needs.

### Struggling

- **Noom** ($1.4B raised, pivoting to GLP-1 meds): Coaching was generic, not grounded in biometric data. Users got bored. Coaches felt robotic. Retention collapsed.
- **Lark Health** ($185M raised, pivoted B2B): Consumer product couldn't retain users. Pivoted to selling to insurers for chronic disease management — which worked. Pre-LLM era AI, clinical UX.

### Surviving but limited

- **Whoop Coach**: GPT-4 powered, great product, but locked behind hardware. Users report advice feels "vapid and non-committal" because it only sees biometrics, not lifestyle context.
- **Fitbit + Gemini**: Strong but locked to Google/Pixel ecosystem.
- **ONVY / Athlytic / Cora / Vora**: Small indie apps, no distribution, no insurance partnerships, targeting fitness enthusiasts.

### Common failure patterns

1. **No distribution partner** — consumer health apps die from $30-80 CAC and 95% churn within 90 days
2. **Generic advice** — "drink more water" isn't coaching. Apps that work ground every recommendation in actual data
3. **Hardware dependency** — creates a ceiling, only reaches already health-conscious people
4. **Wrong target user** — everyone builds for fitness enthusiasts who already have routines. The massive untapped market is sedentary people

---

## Features

### Core Features (build these for the hackathon)

#### Feature 1: Smart Onboarding Chat
- 2-minute conversation where Mistral builds the user's full health profile
- No forms, no dropdowns — natural conversation
- LLM extracts structured JSON from natural language
- **User value:** Feels like talking to a personal trainer, not filling out a medical questionnaire
- **Alan value:** Structured health data collection that members actually complete (form abandonment is 70-80% in health apps)
- **Mistral value:** Shows function calling — LLM extracts structured JSON from natural conversation

#### Feature 2: Health Data Import & Interpretation
- Upload Apple Health XML export, Garmin CSV, or synthetic data
- Parse sleep, heart rate, HRV, steps, workouts, sedentary time
- Explain what it sees in plain language
- **User value:** "Oh, so that's why I've been exhausted — my deep sleep dropped 40% this month"
- **Alan value:** Early detection of burnout patterns, sedentary behavior, sleep degradation — all precursors to medical claims
- **Mistral value:** Structured data extraction + long-context reasoning over weeks of data

#### Feature 3: Daily Personalized Briefing
- Every morning: short message combining yesterday's data + goals + context
- Example: "You slept 5h30, been in caloric deficit 3 days. Today: light yoga or walk, prioritize protein, bed by 22h30."
- **User value:** Removes decision fatigue — the #1 reason people drop fitness routines
- **Alan value:** Continuous engagement loop. Daily touchpoint. Engaged member = healthier member
- **Mistral value:** Context-aware generation with real personalization, not template filling

#### Feature 4: Ask Anything Coach
- Free-form chat: "I tweaked my knee running", "What should I eat tonight?", "Is my resting heart rate normal?"
- Knows when to say "see a doctor" vs. when to advise
- **User value:** Personal trainer / nutritionist / wellness coach available 24/7 who knows your history
- **Alan value:** Deflects low-severity health anxiety from GP visits ($25-30 per consult saved)
- **Mistral value:** Multi-turn reasoning with memory, safety guardrails

#### Feature 5: Weekly Recap & Trend Analysis
- Visual summary: sleep trend, activity consistency, recovery pattern
- AI-written narrative: "Most active week in a month, but sleep is degrading. Next week: same volume, earlier bedtimes."
- **User value:** Accountability without guilt. Progress you can see.
- **Alan value:** Longitudinal health data proving prevention works. Brand differentiation.
- **Mistral value:** Summarization over structured time-series data + narrative generation in French

### Killer Differentiating Features

#### Killer Feature 1: "Body Forecast" — 3-day prediction
- Every app tells you what happened yesterday. Nobody tells you what's coming.
- Uses 14-30 days of trends (HRV decline + sleep debt + resting HR trend) to predict crashes
- Example: "If nothing changes, you'll hit a wall by Thursday. Here's what to do today and tomorrow to avoid it."
- HRV + sleep debt + resting HR trend are genuinely predictive of illness/injury/burnout — science is well-established
- **Demo moment:** 3-day forecast card: "🟡 Wednesday — moderate risk. 🔴 Thursday — high risk. Here's your rescue plan."
- **Alan value:** Preventing a burnout saves €10K+ in avoided claims
- **Mistral value:** Multi-day temporal reasoning over structured data

#### Killer Feature 2: "What If" Simulator
- Let users ask hypothetical questions answered against their own data history
- "What if I drink tonight?" → "Based on your history, alcohol on high-stress days drops your deep sleep by 40%. Last time (March 28), you felt terrible. One glass of wine before 20h is your least-bad option."
- "What if I skip my workout?" → weighs weekly active minutes vs. HRV recovery need
- "What if I stay up until 1am?" → projects impact on sleep debt and Thursday HRV
- **Why different:** Whoop Coach answers questions about the past. This answers questions about the future.
- **Demo moment:** Type "What if I have 3 beers tonight?" → AI shows impact on sleep, tomorrow's recovery, Thursday forecast, all from YOUR data
- **Mistral value:** Multi-step conditional reasoning with personalized data

#### Killer Feature 3: "Prove It" — Personal Correlation Engine
- Mines your own data to find correlations specific to YOU
- "On days when you have caffeine after 15h, your deep sleep drops by 18 minutes. This happened 8 out of 11 times. This is YOUR data, not a medical study."
- "Alcohol doesn't affect your sleep much on low-stress days (-8 min). But on high-stress days, one drink costs you 35 minutes of deep sleep. The combination is what hurts."
- **Why different:** Generic advice is boring. "YOUR caffeine after 3pm costs YOU 18 minutes of deep sleep, here are the 8 nights that prove it" is undeniable
- **Viral potential:** "Look what my app found about me" is inherently shareable
- Best as a "roadmap" slide for hackathon — needs 30+ days of rich data to be convincing

#### Killer Feature 4: "Twin Compare" — Anonymous Cohort Benchmarking
- Compare against people with similar profile (age, job, lifestyle) — not against elite athletes
- "Your 5h40 sleep puts you in the bottom 15% of 28-32 year olds in tech. But your HRV is top 30%."
- "People with your profile who improved sleep to 7h+ saw stress scores drop 1.2 points in 3 weeks."
- **Why unique:** Impossible without an insurer partner. No standalone app has demographic + health data at scale. This is Alan's moat.
- Best as a "roadmap" slide — requires Alan's real member data

#### Killer Feature 5: "The One Thing" — Daily Micro-Commitment
- Every morning, ONE single highest-impact action. Not 5 tips, not a dashboard. One sentence.
- "Today's one thing: no caffeine after 14h. Your deep sleep has been suffering and this is the fastest lever."
- Next day, feedback: "You went caffeine-free after 14h. Result: 62 min deep sleep vs. your average of 44. That's +41%. Keep going?"
- **Why different:** Every health app overwhelms with data, charts, and 10 recommendations. Decision fatigue kills adherence.
- **Retention mechanic:** One commitment → feedback next day → new commitment = daily habit loop
- **Build for the hackathon:** This is very demo-able and impressive

### Features to build for hackathon (10h): The One Thing + What If + Body Forecast
### Features for "roadmap" slides: Prove It + Twin Compare

---

## Data Architecture

### The minimum viable dataset (3 categories)

Most apps only have biometric data. Having all three (biometric + behavioral + contextual) is the edge.

#### Category 1: Sleep Data (most important)

| Field | Example | Insight |
|---|---|---|
| Sleep duration | 6h12min | Are they sleeping enough? |
| Time to bed | 00:45 | Late screens, irregular schedule |
| Wake time | 06:57 | Combined with bed time → sleep consistency |
| Deep sleep minutes | 48min | Physical recovery. Low deep + high stress = burnout signal |
| REM minutes | 65min | Cognitive recovery |
| Light sleep minutes | 225min | Filler — but ratio matters |
| Awake minutes | 34min | Frequent waking = stress, alcohol, sleep apnea |
| Sleep efficiency | 87% | Time asleep / time in bed. Below 85% = problem |
| Wake-up count | 3 | Stress/alcohol/apnea indicator |

#### Category 2: Heart Rate Data

| Field | Example | Insight |
|---|---|---|
| Resting heart rate (daily) | 62 bpm | Trending up = overtraining, stress, illness |
| HRV (heart rate variability) | 38ms | Best proxy for autonomic nervous system health. Declining = accumulated stress |
| HR during workouts | Avg 145, Max 172 | Training zone validation |
| HR recovery post-workout | -30bpm in 1min | Cardiovascular fitness indicator |

#### Category 3: Activity Data

| Field | Example | Insight |
|---|---|---|
| Daily steps | 4,200 | Below 5,000 = sedentary |
| Active minutes | 18min | WHO: 150min/week moderate. Most sedentary workers: 40-60min |
| Sedentary hours | 11.5h | Sitting time correlates with all-cause mortality independently of exercise |
| Workouts (type, duration, intensity) | Running, 32min, avg HR 148 | What they actually do vs. what they say |
| Active calories | 280 kcal | Context for nutrition |

#### Category 4: Subjective / Self-Reported (collected through chat — THIS IS THE DIFFERENTIATOR)

| Field | Example | Insight |
|---|---|---|
| Stress level (1-5) | 4/5 | Correlate with HRV to validate perception |
| Energy level (1-5) | 2/5 | Low energy + good sleep = nutrition issue. Low energy + bad sleep = obvious |
| Mood (1-5) | 3/5 | Trending down = mental health flag |
| Soreness / pain | Lower back, 3/5 | Adjust exercise recs, flag chronic issues |
| Main stressor (free text) | "Deadline at work" | Makes AI response feel human |
| Meals (rough) | "Skipped lunch, big dinner" | Blood sugar crashes, sleep disruption |
| Alcohol / caffeine | "2 coffees, 1 beer" | Caffeine after 14h destroys deep sleep. Alcohol suppresses REM. Easiest wins. |
| Screen time before bed | true/false | Explains late sleep onset |

#### Data you DON'T need (keep it simple)

- Continuous HR stream (summaries are enough)
- GPS / location
- Blood pressure (most people don't measure it)
- Blood glucose / CGM (too niche, expensive hardware)
- Detailed macro nutrition (food logging has terrible adherence — keep to rough patterns)
- Daily weight (causes anxiety, weekly trend is enough)

### Ideal Daily Data Object for Mistral

```json
{
  "user_profile": {
    "age": 29,
    "gender": "male",
    "job": "software engineer",
    "goals": ["sleep better", "reduce stress", "move more"],
    "constraints": ["knee injury left side", "no gym access"],
    "baseline_hrv": 42,
    "baseline_rhr": 58
  },
  "today": {
    "date": "2026-04-10",
    "sleep": {
      "duration_min": 372,
      "bed_time": "00:45",
      "wake_time": "06:57",
      "deep_min": 48,
      "rem_min": 65,
      "light_min": 225,
      "awake_min": 34,
      "efficiency": 0.87,
      "wake_ups": 3
    },
    "heart": {
      "resting_hr": 65,
      "hrv_ms": 33
    },
    "activity": {
      "steps": 4200,
      "active_min": 18,
      "sedentary_hours": 11.5,
      "workouts": []
    },
    "self_reported": {
      "stress": 4,
      "energy": 2,
      "mood": 3,
      "caffeine": "2 coffees (8h, 14h30)",
      "alcohol": "1 beer with dinner",
      "meals": "skipped lunch, large pasta dinner 21h",
      "screen_before_bed": true,
      "notes": "big deadline tomorrow"
    }
  },
  "trends_7d": {
    "avg_sleep_duration": 385,
    "avg_hrv": 36,
    "hrv_trend": "declining",
    "avg_rhr": 63,
    "rhr_trend": "rising",
    "avg_steps": 4800,
    "avg_deep_sleep": 52,
    "deep_sleep_trend": "declining",
    "avg_stress": 3.7,
    "stress_trend": "rising"
  },
  "trends_30d": {
    "avg_hrv": 41,
    "avg_rhr": 59,
    "avg_steps": 5600,
    "avg_sleep_duration": 402,
    "best_sleep_night": "2026-03-22",
    "worst_sleep_night": "2026-04-08"
  }
}
```

This is ~1.5KB of JSON. Fits trivially in Mistral's context window. With this single object the LLM can compare today vs. 7-day vs. 30-day baselines, detect declining trends, correlate subjective stress with objective HRV, explain why last night's sleep was bad, recommend specific actions, and respect user constraints (e.g., knee injury → no running).

---

## Data Sources

### For the Hackathon (use these)

1. **Kaggle: Sleep Health and Lifestyle Dataset** — 374 rows, 14 columns (sleep duration, quality, physical activity, stress, BMI, blood pressure, heart rate, steps, sleep disorders). One clean CSV. URL: kaggle.com/datasets/uom190346a/sleep-health-and-lifestyle-dataset

2. **Simula PMData** (RICHEST — recommended) — 16 people, 5 months, Fitbit data: 20M+ heart rate measurements, steps/minute, sleep scores (deep/REM/light), resting HR, sedentary minutes, active minutes, plus subjective wellness reports (fatigue, mood, readiness, stress, soreness 1-5 scales). JSON format. URL: datasets.simula.no/pmdata/

3. **Figshare: Real-world HRV + Sleep Diaries** — 49 healthy individuals, 4 weeks continuous smartwatch data, HRV in 5-minute segments, sleep diaries, clinical questionnaires (anxiety, depression, stress), demographics. URL: doi.org/10.6084/m9.figshare.28509740

4. **Aidlab Free Datasets** — ECG, heart rate, HRV, respiration, skin temperature, motion. Good for specific workout sessions. URL: aidlab.com/datasets

5. **Fitabase Example Data** — Sample Fitbit exports: sleep stages (30s resolution), HR at various intervals, daily resting HR, steps. URL: fitabase.com/resources/knowledge-base/exporting-data/example-data-sets/

6. **Your own Apple Health export** — iPhone → Health app → profile icon → "Export All Health Data" → export.zip → export.xml. Parse with simple Python iterparse script.

7. **Synthetic data** — Generate 30 days of realistic JSON for a fictional persona. Give her a narrative arc (good week → stressful sprint → partial recovery). 20 minutes to write. Can have Mistral generate it.

**Recommendation:** Use PMData (#2), pick one person's 30-day data, flatten to daily JSON objects. Or generate synthetic data with a compelling narrative arc for the demo.

### For Production (real integration)

| Source | Data available | Access method | Constraints |
|---|---|---|---|
| **Apple Health (HealthKit)** | Steps, HR, resting HR, HRV, sleep stages, workouts, calories, respiratory rate, SpO2, walking steadiness, menstrual tracking, medications (new WWDC 2025 API) | Requires native iOS app. No backend API. All data stays on-device. Per-data-type user consent. | Web apps can't read HealthKit live — need native app or manual XML export |
| **Whoop** | Recovery, strain, sleep (stages, RHR, HRV, respiratory rate, wake events), workouts (HR zones, calories, duration), body measurements | REST API, OAuth 2.0, free, webhooks. Must own a Whoop device. | No continuous HR via API (only summaries). Cannot resell data. Every integration reviewed by Whoop. |
| **Garmin** | Steps, HR, sleep, stress, Body Battery, respiration, SpO2, workouts, GPS, calories | Developer partnership application, OAuth, webhooks, free but approval-gated | Generally developer-friendly. Massive European user base. |
| **Oura Ring** | Sleep (stages, duration, latency, efficiency), readiness, activity, HR, HRV, body temp deviation, SpO2 | Oura Cloud API v2, OAuth 2.0, free, webhooks | Well-documented. Oura users tend to be health-optimizers. |
| **Fitbit (Google)** | Steps, HR, sleep stages, SpO2, skin temp, breathing rate, calories, workouts, weight, food logs | Fitbit Web API, OAuth 2.0, free but rate-limited | Google tightening API as they merge Fitbit into Pixel. Long-term availability uncertain. |
| **Samsung Health** | Steps, HR, sleep, workouts, nutrition, body measurements via Android Health Connect | On-device only (like HealthKit), requires Android app | Android equivalent of HealthKit |
| **Strava** | Workouts, GPS, HR during activities, power, pace, elevation | REST API but increasingly restricted | No resting data, no sleep, no HRV. Unreliable as primary source. |

**Unified API option: Terra** — Single API normalizing data from Whoop, Garmin, Fitbit, Oura, Samsung, Apple Health into one payload format. Paid service but massively simplifies multi-device support.

**Open-source option: Open Wearables** — Self-hosted, single API for Apple Health, Garmin, Whoop, Polar, Suunto, Strava, Samsung. No per-user fees. MIT licensed.

**Alan's internal data (the hidden goldmine):**
- Claims data — what members are treated for, medication reimbursements, GP visit frequency
- Demographic data — age, gender, location, profession
- Engagement data — how often members use Alan's app
- Teleconsultation data — if Alan offers telehealth

Combining insurer data + wearable data is the real magic. Wearable says someone sleeps poorly + Alan's data says they were prescribed anxiolytics = burnout intervention signal neither source triggers alone.

### Production Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Apple Watch  │  │   Whoop     │  │ Oura/Garmin │
│ (HealthKit)  │  │   (REST)    │  │  (REST)     │
└──────┬───────┘  └──────┬──────┘  └──────┬──────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────────────────────────────────────────┐
│          Terra API / Open Wearables             │
│         (unified normalized payload)            │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Your backend                       │
│  - User profile + goals (from onboarding)       │
│  - Wearable data (daily sync)                   │
│  - Alan insurer data (API partnership)          │
│  - Context builder → Mistral system prompt      │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Mistral LLM                        │
│  System prompt: user profile + 14 days data     │
│  → Daily briefing, coaching, weekly recap       │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack (10h hackathon)

- **Frontend:** React / Next.js — clean, minimal UI
- **Backend:** Mistral API with rich system prompt injected with user context JSON
- **Data parsing:** Python script for Apple Health XML or PMData JSON → daily summaries
- **Storage:** Local storage or lightweight DB for user profile persistence (or just in-memory for demo)
- **No auth needed** for hackathon demo

---

## Value Proposition Summary

### For the User

| Feature | Value |
|---|---|
| Smart Onboarding | "Feels like a friend, not a form" |
| Data Import | "Finally understand my own body" |
| Daily Briefing | "Removes decision fatigue" |
| Ask Anything | "A €70/h coach for free" |
| Weekly Recap | "Accountability without guilt" |
| Body Forecast | "Know what's coming before it hits" |
| What If | "Test decisions before making them" |
| The One Thing | "One action, maximum impact, zero overwhelm" |

### For Alan (insurer)

| Feature | Value |
|---|---|
| Smart Onboarding | Structured lifestyle data on members, voluntarily given |
| Data Import | Early risk detection before claims (burnout = €5K-15K saved per case) |
| Daily Briefing | Daily engagement touchpoint (engaged member = healthier member) |
| Ask Anything | Deflects low-value GP visits (€25-30 per consult saved) |
| Weekly Recap | Retention + brand differentiation (no other French mutuelle does this) |
| Body Forecast | Prevent burnout before it becomes a medical leave |
| Twin Compare | Impossible without insurer data = moat |
| The One Thing | Member opens app daily = retention weapon |

### For Mistral (judges)

| Feature | Value |
|---|---|
| Smart Onboarding | Function calling — structured extraction from conversation |
| Data Import | Long-context reasoning over weeks of time-series data |
| Daily Briefing | Multi-variable synthesis with personalization |
| Ask Anything | Multi-turn memory + safety guardrails |
| Weekly Recap | Narrative generation over structured data in French |
| Body Forecast | Temporal reasoning + prediction |
| What If | Multi-step conditional reasoning with personalized data |
| The One Thing | Prioritization reasoning — weigh multiple signals, choose best intervention |

---

## The Pitch

### Opening

"Everyone has health data on their phone. Nobody knows what to do with it. We turn passive data into a daily conversation that keeps you healthy."

### The problem

95% of health apps target athletes. But Alan insures software engineers, product managers, and designers who sit 10 hours a day. These people don't need a training plan — they need someone to tell them their body is heading toward burnout before they feel it.

### Why now

- Lark proved insurers will pay for AI health coaching ($185M raised, pivoted B2B to insurers)
- Noom proved generic coaching doesn't retain users ($1.4B raised, pivoting to meds)
- Whoop proved conversational AI on biometric data works (GPT-4 powered, millions of daily interactions)
- We combine all three lessons: data-grounded + LLM-powered + insurer-distributed

### What's different

- Every health app tells you what happened. We tell you what's **coming** (Body Forecast)
- We let you **test decisions before you make them** (What If)
- We give you **one action per day** your data says will have the biggest impact (The One Thing)
- Not built for athletes — built for the 95% who need it most

### The moat

- The more you use it, the better it knows you (memory + correlation engine)
- Twin Compare is impossible without an insurer partner's demographic + health data
- Distributed through Alan = zero CAC, built-in user base
- Powered by Mistral = sovereign European AI for European health data

### Demo flow (3 minutes)

1. Open the app → Smart onboarding chat (30s, show structured JSON extraction)
2. Data loads → show 14-day dashboard with trends
3. Body Forecast → "🔴 Thursday risk" card
4. Ask "What if I drink tonight?" → personalized impact prediction
5. Show "The One Thing" for today with yesterday's feedback
6. Close with weekly recap narrative in French

---

## Existing Competitors Reference

| Company | Model | Status | Weakness you exploit |
|---|---|---|---|
| Whoop Coach | GPT-4 on Whoop data | Active, $30/mo device required | Locked to hardware, athletes only, no lifestyle context, advice often generic |
| Fitbit + Gemini | Gemini baked into Fitbit app | Active, Google ecosystem only | Locked to Fitbit/Pixel, no insurer angle |
| Apple Coach | Coming iOS 19 | Not yet launched | Apple Watch required, no insurer partnership |
| ONVY | AI on wearable data | Active, small | No distribution, no insurer, athletes focus |
| Noom | Psychology-based coaching + food logging | Alive but pivoting to GLP-1 meds | Generic advice, no biometric grounding, retention problems |
| Lark Health | AI chronic disease management | Pivoted B2B to insurers | Pre-LLM AI, clinical UX, not conversational |
| Forward | AI CarePods in malls | Dead (Nov 2024, $400M burned) | Hardware costs, couldn't scale |
| Cydoc | AI-native EHR | Dead (Aug 2025) | No distribution partner |
| Athlytic/Cora/Vora | Apple Health + AI coaching | Active, small | Indie apps, no distribution, no insurer |

---

## Recommended Demo Persona

**Marie, 31, Product Manager at a Paris startup.**

Create 30 days of synthetic data with this narrative arc:
- **Week 1 (good baseline):** 7h sleep, HRV 45, RHR 56, 6K steps, low stress
- **Week 2 (stress begins):** Sleep drops to 6h, HRV 40, caffeine increases, bedtime shifts later
- **Week 3 (the spiral):** Sleep 5h30, HRV 32, RHR 65, 3K steps, skipping meals, alcohol on 3 nights, stress 4-5/5
- **Week 4 (partial recovery):** Following the app's advice, sleep climbing back, HRV recovering, one relapse night

This narrative lets the AI say: "Your last two weeks look like the beginning of a burnout pattern. I've been tracking it. Here's what to do."
