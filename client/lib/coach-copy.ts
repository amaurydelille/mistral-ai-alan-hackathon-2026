// All pre-written coach responses — keyed by screen.
// Every paragraph references Marie's actual mock numbers so the demo feels
// like live AI output. Replace this file's imports with real Mistral calls
// in the next iteration.

export const onboardingScript = [
  {
    from: "coach" as const,
    text: "Hey Marie! I'm your health coach. I'm going to ask you a few quick questions so I can personalize everything for you. This takes about 2 minutes — no forms, I promise. Ready?",
  },
  {
    from: "user" as const,
    text: "Yes, let's go!",
  },
  {
    from: "coach" as const,
    text: "Great. First — what are the top 1 or 2 things you'd most like to improve about your health or energy right now?",
  },
  {
    from: "user" as const,
    text: "I want to sleep better and feel less exhausted at work. Stress has been through the roof lately.",
  },
  {
    from: "coach" as const,
    text: "Got it — sleep quality and stress management. Those are closely linked, which is actually good news. Do you have any physical constraints I should know about? Injuries, limited time, no gym access?",
  },
  {
    from: "user" as const,
    text: "No gym, and my evenings are usually packed with meetings or social stuff.",
  },
  {
    from: "coach" as const,
    text: "Perfect, I'll keep everything practical for your schedule. Last question: do you drink caffeine or alcohol regularly? No judgment — I just need this to give you accurate advice.",
  },
  {
    from: "user" as const,
    text: "Yes to both. Usually 2-3 coffees a day, and wine a few nights a week.",
  },
  {
    from: "coach" as const,
    text: "That's really useful — these are actually two of the biggest levers for your sleep quality. I've built your profile. Let me pull in your health data and I'll show you exactly what's going on.",
    extractedProfile: {
      name: "Marie",
      age: 31,
      job: "Product Manager",
      goals: ["better sleep", "reduce stress"],
      constraints: ["no gym", "busy evenings"],
      caffeine: "2–3 coffees/day",
      alcohol: "wine a few nights/week",
      key_insight: "Caffeine + alcohol combination is the #1 sleep disruptor to address",
    },
  },
];

export const dashboardBriefing =
  "Marie, last night was rough — 5h30 of sleep with only 38 minutes of deep sleep (your weekly average was already at 45, well below your 82-minute baseline). Your HRV this morning is 29ms, down from your natural baseline of 45ms. That's a 35% drop over 13 days. Your resting heart rate has been climbing for 8 days straight — it's now 67bpm versus your usual 56. The pattern is clear: your body is accumulating stress faster than it can recover. The good news is you have three days this week where you did cut caffeine after 14h — and on those nights, your deep sleep was noticeably better. That's the lever we're going to pull.";

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
  headline: "Your most stressful week in months — but the last 3 days show it's turning.",
  narrative: `This was a hard week, Marie. Sleep dropped to an average of 5h48 — nearly 2 hours below your natural baseline. Your HRV fell to 32ms, and your resting heart rate climbed to 65bpm. On April 6th, you hit what looks like a low point: 35 minutes of deep sleep, HRV at 28ms, 5 wake-ups.

But look at the last 3 days. You cut caffeine after 14h twice. You went to bed before midnight twice. Your HRV has ticked up from 28 to 37ms. Your deep sleep last night was 62 minutes — the best in 10 days.

Next week: same direction. The goal isn't perfection, it's consistency. If you can string together 5 nights with caffeine cut-off at 14h and lights out by 23h, your HRV should be back above 40ms by next weekend. That's when you'll start feeling the difference in your energy.

One thing to watch: your resting HR is still elevated. If it hasn't started dropping by Wednesday, I'll flag it.`,
  nextWeekGoal: "5 nights: caffeine cut-off 14:00 + lights out 23:00",
};
