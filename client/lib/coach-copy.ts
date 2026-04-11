// All pre-written coach responses — keyed by screen.
// Every paragraph references Amaury's actual mock numbers so the demo feels
// like live AI output. Replace this file's imports with real Mistral calls
// in the next iteration.

export const onboardingScript = [
  {
    from: "coach" as const,
    text: "Hi Amaury. I'm Vital, your AI health coach. I've connected your wearable — the data is already loaded. One question before I show you: what's your main focus right now?",
  },
  {
    from: "user" as const,
    text: "Sleep and energy mostly. I've been running on empty for weeks.",
  },
  {
    from: "coach" as const,
    text: "That tracks exactly with what I'm seeing in your data. Sleep debt, a rising resting heart rate, and a bedtime that's been slipping later every night. I've built your profile — let me show you what's actually going on.",
    extractedProfile: {
      name: "Amaury",
      age: 31,
      job: "Product Manager",
      goals: ["better sleep", "more energy"],
      caffeine: "2–3 coffees/day",
      alcohol: "wine a few nights/week",
      key_insight: "Late bedtime + caffeine is the primary sleep disruptor",
      sleep_debt_7d: "2h 40m",
      rhr_trend: "rising (+11 bpm vs baseline)",
    },
  },
];

export const dashboardBriefing =
  "Last night was rough — **5h30 of sleep**, only **38 minutes of deep sleep** against your 82-minute baseline. **HRV this morning is 29ms**, down **35% in 13 days**. **Resting heart rate** has climbed for 8 straight days and is now **67 bpm** versus your usual 56. Your body is accumulating stress faster than it can recover. The bright spot: the **3 nights you cut caffeine after 14h**, deep sleep was noticeably better. **That's the lever.**";

export const forecastRescuePlan = [
  {
    step: 1,
    action: "No caffeine after 14:00 today",
    why: "On your last 3 caffeine-free afternoons, deep sleep improved by an average of 19 minutes. It's your fastest win.",
  },
  {
    step: 2,
    action: "Phone down by 22:30, in bed by 23:00",
    why: "Your sleep onset has been averaging 45 minutes — cutting screen time gives your melatonin a fighting chance.",
  },
  {
    step: 3,
    action: "10-minute walk after lunch today",
    why: "Even a short activity burst after lunch lowers your afternoon cortisol and makes evening wind-down significantly easier.",
  },
];

export const whatIfResponses: Record<string, string> = {
  "What if I have 3 beers tonight?": `Based on your last 14 nights, alcohol on high-stress days (like today, stress 5/5) costs you 28–35 minutes of deep sleep. The night of April 6th — when you had 3 beers at stress level 5 — you got only 35 minutes of deep sleep and woke up 5 times. Your HRV the next morning dropped to 28ms, your lowest recorded.

Three beers tonight would almost certainly push Thursday's HRV below 25ms — the threshold where I'd start flagging burnout risk. Your body doesn't have the recovery buffer right now.

If you want to have something, one glass of wine before 20:00 is your least-bad option. The timing matters more than the amount.`,

  "What if I skip my workout?": `Honestly, given where your HRV is today (29ms), skipping an intense workout is actually the right call. Your body is in recovery deficit — adding training stress would push Thursday's risk higher, not lower.

What I'd suggest instead: a 10-minute walk after lunch. It's enough to get some active minutes in, lower afternoon cortisol, and help you wind down tonight — without putting additional load on your nervous system.

On days when your HRV is above 38ms, I'll tell you the opposite. Right now, rest is the workout.`,

  "What if I stay up until 1am?": `You've gone to bed after 1am 6 times in the last 14 days. On those nights, your average deep sleep was 39 minutes. On nights when you were in bed before midnight, it was 61 minutes — that's 56% more deep sleep, same total hours.

If you stay up until 1am tonight, Thursday's forecast goes from high risk to very high risk. Your HRV recovery window compresses to about 4 hours, which isn't enough given your current RHR trend.

The single highest-impact thing you can do tonight: lights out by 23:00. It won't feel dramatic, but the data is very clear on this one.`,
};

export const oneThingToday = {
  action: "No caffeine after 14:00",
  why: "On the 3 nights you did this over the past 2 weeks, your deep sleep averaged 61 minutes — vs. 44 minutes on caffeine days. That's +38%. It's your single highest-leverage move right now.",
  yesterday: {
    commitment: "No screens after 22:30",
    result: "Deep sleep: 44 → 62 minutes (+41%). Wake-ups dropped from 4 to 2.",
    kept: true,
  },
};

export const weeklyRecap = {
  headline: "Most stressful week in months — but the last 3 days show it's turning.",
  narrative: `Hard week. Sleep averaged 5h48 — nearly 2 hours below your baseline. HRV fell to 32ms, resting HR climbed to 65 bpm. April 6th was the low point: 35 min of deep sleep, HRV at 28ms, 5 wake-ups.

But the last 3 days are different. Caffeine cut-off at 14h twice. In bed before midnight twice. HRV has ticked up from 28 to 37ms. Deep sleep last night hit 62 minutes — best in 10 days.

Next week: same direction. String together 5 nights with caffeine cut at 14h and lights out by 23h — HRV should clear 40ms by next weekend. That's when the energy difference becomes noticeable.

One flag: resting HR is still elevated. If it hasn't started dropping by Wednesday, I'll tell you.`,
  nextWeekGoal: "5 nights: caffeine cut-off 14:00 + lights out 23:00",
};
