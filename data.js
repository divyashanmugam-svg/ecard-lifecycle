// Medical e-card lifecycle — all content lives here. Edit copy / timings in this file only.
// Placeholders: [Name] [Destination] [Policy ID] [number] [Hospital] [date]

const PHASES = {
  issued: { label: "Issued",    sub: "Purchase → 15 days before start", color: "#8A6D00", soft: "#FFF6E0" },
  pre:    { label: "Pre-trip",  sub: "15 days before → trip start · quiet until T-3", color: "#6841E6", soft: "#F3F3FF" },
  trip:   { label: "In-trip",   sub: "Trip start → trip end",            color: "#0E8A5F", soft: "#E8F7F0" },
  post:   { label: "Post-trip", sub: "Trip end → 30 days after",         color: "#5B6475", soft: "#F1F2F5" },
};

const ROWS = {
  sched: { label: "We send on schedule", icon: "◷" },
  tap:   { label: "Customer taps something", icon: "☝" },
  flow:  { label: "Check-in & case flow", icon: "⇄" },
};

const CH = {
  wa:    { label: "WhatsApp",                 color: "#128C7E" },
  push:  { label: "Push",                     color: "#6841E6" },
  email: { label: "Email",                    color: "#C2410C" },
  inapp: { label: "In-app",                   color: "#475569" },
};

const NODES = [
/* ───────────────────────── ISSUED → T-15 ───────────────────────── */
{
  id: "p1", phase: "issued", row: "sched", col: 1, when: "Purchase = issuance (instant)",
  title: "Policy issued: PDF only",
  trigger: "Policy is purchased and issued. purchase_at and issued_at are the same moment. Both are stored.",
  why: "They may not travel for months. All they need today is the policy document.",
  rules: [
    "Send within 2 minutes of issuance.",
    "WhatsApp + email carry the policy PDF. Nothing about the e-card.",
    "If the trip starts within 3 days, send the T-3 documents message straight after.",
  ],
  analytics: ["policy_issued_message_sent"],
  msgs: [
    { ch: "wa", label: "WhatsApp · utility template", thread: [
      { from: "bot", doc: "ACKO_Travel-Policy_APHP088300100.pdf",
        text: "Hi [Name] 👋 Your ACKO international travel policy for *[Destination]* is confirmed.\n\nYour policy document is attached." } ] },
    { ch: "email", to: "Customer", subject: "Your ACKO travel policy for [Destination] is confirmed",
      body: "Hi [Name],\n\nYour policy [Policy ID] is confirmed for [Destination], [start date]–[end date].\n\nYour policy document is attached." },
  ],
},
{
  id: "q1", phase: "issued", row: "tap", col: 1, when: "Any e-card action",
  title: "Any action: stay quiet",
  trigger: "View, download, call, share or email, any number of times, from issuance until 3 days before the trip.",
  why: "Nobody is travelling yet. However much they poke around, we say nothing.",
  rules: [
    "No WhatsApp, push, check-in or Europ Assistance email.",
    "The app still works normally: the card shows ‘Trip starts [date]’, downloads give the usual toast.",
    "Analytics still fire, so we know who prepared early.",
  ],
  analytics: ["medical_ecard_viewed", "medical_ecard_download", "medical_ecard_call_tapped", "medical_ecard_share"],
  msgs: [
    { ch: "inapp", label: "On the card", title: "Trip starts [date]", body: "Your e-card is valid during your trip." },
  ],
},

/* ───────────────────────── PRE-TRIP: T-15 → trip start ───────────────────────── */
{
  id: "p2", phase: "pre", row: "sched", col: 2, when: "T-15 → T-3",
  title: "Still quiet",
  trigger: "Pre-trip begins 15 days before the trip, but nothing is sent until 3 days before.",
  why: "Pre-trip is the boundary where we get ready to talk. The talking starts at T-3.",
  rules: [
    "No scheduled message in this stretch.",
    "Actions are ignored, same as the issued window.",
    "For a customer who bought 10 days before the trip, this window starts at issuance.",
  ],
  analytics: [],
  msgs: [
    { ch: "inapp", label: "Nothing sent", title: "No messages", body: "Nothing goes out between T-15 and T-3." },
  ],
},
{
  id: "p3", phase: "pre", row: "sched", col: 3, when: "3 days before trip start",
  title: "Your medical e-card is ready",
  trigger: "Trip start date minus 3 days. 10:00 customer local time.",
  why: "First e-card message. Text only, no card image. Get it downloaded before they fly.",
  rules: [],
  analytics: ["ecard_intro_sent"],
  msgs: [
    { ch: "wa", label: "WhatsApp · 1 traveller, text only", thread: [
      { from: "bot", text: "*Your medical e-card is ready*\n\nFlying to [Destination] in 3 days, [Name]? Keep this card with you.\n\nIf you ever need hospital admission, show it at the billing desk. The hospital will then work with Europ Assistance to arrange cashless admission.\n\nSave it now so it opens even without internet.\n\nEmergency? Call 24/7 on +91 22 6963 5374. Cashless admission is subject to admissibility and coverage.",
        buttons: ["Download e-card", "View policy PDF"] } ] },
    { ch: "wa", label: "WhatsApp · 4 travellers, text only", thread: [
      { from: "bot", text: "*Medical e-cards are ready for all 4 of you*\n\nFlying to [Destination] in 3 days? [Name 1], [Name 2], [Name 3] and [Name 4] each have their own card.\n\nIf anyone needs hospital admission, show that person's card at the billing desk. The hospital will then work with Europ Assistance to arrange cashless admission.\n\nSave them now so they open even without internet.\n\nEmergency? Call 24/7 on +91 22 6963 5374. Cashless admission is subject to admissibility and coverage.",
        buttons: ["Download e-cards", "View policy PDF"] } ] },
    { ch: "push", title: "Your medical e-card is ready", body: "Save it now so it opens even without internet.", link: "Opens: Medical e-card" },
  ],
},
{
  id: "p5", phase: "pre", row: "tap", col: 3, when: "T-3 → trip start",
  title: "Any action: no check-in",
  trigger: "Any e-card tap from 3 days before until the trip starts.",
  why: "From T-3 we respond, but gently. They're preparing, not in trouble.",
  rules: [
    "View, call, share, email: nothing sent. Call shows a one-line info sheet; no callback is offered because cover hasn't started.",
    "Download: toast + one WhatsApp confirmation (new template), once per policy.",
    "No check-in and no email to Europ Assistance until the trip starts.",
    "Multi-traveller: ZIP when 2+ travellers are selected, file names per PRD.",
  ],
  analytics: ["medical_ecard_download", "medical_ecard_call_tapped", "medical_ecard_share"],
  msgs: [
    { ch: "inapp", label: "Download toast", title: "Saved", body: "ACKO_Medical-eCard_[First-Last]_[Policy ID].pdf", link: "Action: View" },
    { ch: "wa", label: "WhatsApp · new template: download (pre-trip)", thread: [
      { from: "bot", text: "Saved ✅ Your Medical e-card is on your phone and opens without internet.\n\nIf you ever need hospital admission, show it at the billing desk." } ] },
    { ch: "inapp", label: "Call tapped, trip not started", title: "Your trip hasn't started", body: "This is Europ Assistance's 24/7 line for use during your trip. Save it to your contacts.", link: "Buttons: Save contact · Call anyway" },
  ],
},

/* ───────────────────────── IN-TRIP ───────────────────────── */
{
  id: "i1", phase: "trip", row: "sched", col: 4, when: "Trip start day",
  title: "E-card and policy document",
  trigger: "Trip start date, morning in the customer's local time.",
  why: "Two WhatsApp messages: the e-card with its card image, then the policy document.",
  rules: [],
  analytics: ["tripstart_message_sent"],
  msgs: [
    { ch: "wa", label: "WhatsApp · 1. E-card, 1 traveller", thread: [
      { from: "bot", card: "single", text: "*Your medical e-card is ready*\n\nFlying to [Destination] today, [Name]? Keep this card with you.\n\nIf you ever need hospital admission, show it at the billing desk. The hospital will then work with Europ Assistance to arrange cashless admission.\n\nSave it now so it opens even without internet.\n\nEmergency? Call 24/7 on +91 22 6963 5374. Cashless admission is subject to admissibility and coverage.",
        buttons: ["Download e-card", "View policy PDF"] } ] },
    { ch: "wa", label: "WhatsApp · 1. E-card, 4 travellers", thread: [
      { from: "bot", card: "multi", text: "*Medical e-cards are ready for all 4 of you*\n\nFlying to [Destination] today? [Name 1], [Name 2], [Name 3] and [Name 4] each have their own card.\n\nIf anyone needs hospital admission, show that person's card at the billing desk. The hospital will then work with Europ Assistance to arrange cashless admission.\n\nSave them now so they open even without internet.\n\nEmergency? Call 24/7 on +91 22 6963 5374. Cashless admission is subject to admissibility and coverage.",
        buttons: ["Download e-cards", "View policy PDF"] } ] },
    { ch: "wa", label: "WhatsApp · 1. E-card, USA / Canada", thread: [
      { from: "bot", card: "us", text: "*Your medical e-card is ready*\n\nFlying to the USA today, [Name]? Keep this card with you.\n\nIf you ever need hospital admission, show it at the billing desk. The hospital will then work with Europ Assistance to arrange cashless admission.\n\nSave it now so it opens even without internet.\n\nEmergency? Call 24/7 on +1 833 813 8772 in the USA and Canada, or +91 22 6963 5374 anywhere else. Cashless admission is subject to admissibility and coverage.",
        buttons: ["Download e-card", "View policy PDF"] } ] },
    { ch: "wa", label: "WhatsApp · 2. Policy document", thread: [
      { from: "bot", doc: "ACKO_Travel-Policy_APHP088300100.pdf",
        text: "Hi [Name], your trip to *[Destination]* starts today ✈️\n\nYour policy document is attached. Carry it with you. It's your proof of insurance for visa and entry checks." } ] },
    { ch: "push", title: "Your trip starts today ✈️", body: "Your medical e-card and policy document are ready.", link: "Opens: Medical e-card" },
  ],
},
{
  id: "i2", phase: "trip", row: "tap", col: 4, when: "Any e-card action",
  title: "Any action → check-in, straight away",
  trigger: "View, download, call, share or email, any time from trip start to trip end.",
  why: "Immediate WhatsApp check-in. The wording follows what they just did.",
  rules: [],
  analytics: ["medical_ecard_viewed", "medical_ecard_download", "medical_ecard_call_tapped", "medical_ecard_share", "checkin_sent"],
  msgs: [
    { ch: "wa", label: "WhatsApp · after view", thread: [
      { from: "bot", text: "Hi [Name], you just opened your Medical e-card.\n\nIs everything okay?", buttons: ["👍 All good", "👎 I need help"] } ] },
    { ch: "wa", label: "WhatsApp · after download", thread: [
      { from: "bot", text: "Hi [Name], your Medical e-card is saved ✅\n\nIs everything okay?", buttons: ["👍 All good", "👎 I need help"] } ] },
    { ch: "wa", label: "WhatsApp · after share", thread: [
      { from: "bot", text: "Hi [Name], we saw you shared your Medical e-card.\n\nIs everything okay?", buttons: ["👍 All good", "👎 I need help"] } ] },
    { ch: "wa", label: "WhatsApp · after call", thread: [
      { from: "bot", text: "Hi [Name], we saw you called Europ Assistance.\n\nIs everything okay?", buttons: ["👍 All good", "👎 I need help"] } ] },
  ],
},
{
  id: "i7", phase: "trip", row: "flow", col: 5, when: "Taps 👍",
  title: "👍 All good",
  trigger: "Customer replies 👍.",
  why: "Close the loop and stay out of the way.",
  rules: [],
  analytics: ["checkin_replied (ok)"],
  msgs: [
    { ch: "wa", label: "WhatsApp · reply", thread: [
      { from: "user", text: "👍 All good" },
      { from: "bot", text: "Great to hear 👍 Your e-card stays in the app for your whole trip." } ] },
  ],
},
{
  id: "i8", phase: "trip", row: "flow", col: 6, when: "Taps 👎",
  title: "👎 I need help",
  trigger: "Customer replies 👎.",
  why: "Medical help menu. Request callback now lives here, as a link to the form.",
  rules: [],
  analytics: ["checkin_replied (help)", "help_option_tapped"],
  msgs: [
    { ch: "wa", label: "WhatsApp · help options", thread: [
      { from: "user", text: "👎 I need help" },
      { from: "bot", text: "Sorry to hear that.\n\n🚑 If it's life-threatening, call [ambulance number] first.\n\nHow can we help?",
        buttons: ["Request a callback ↗", "Find cashless hospitals near me ↗", "View medical e-card ↗", "Talk to a doctor online ↗"] } ] },
    { ch: "inapp", label: "Callback form (opens from the link)", title: "Request callback", body: "Europ Assistance will call you back within 10 minutes. Please keep your phone nearby and be ready to pick up.", link: "Phone number (prefilled, editable) · What happened? Accident / Illness / Hospital admission / Other · note, optional · hospital, optional · ‘Can't take incoming calls?’ email fallback" },
  ],
},
{
  id: "i10", phase: "trip", row: "flow", col: 7, when: "Customer submits the form",
  title: "Callback requested",
  trigger: "Customer submits the Request callback form. One email goes to Europ Assistance.",
  why: "Four things happen at once: alert card, push, WhatsApp, and the email to Europ Assistance.",
  rules: [],
  analytics: ["medical_ecard_request_callback", "callback_email_sent"],
  msgs: [
    { ch: "inapp", label: "Alert card on the e-card and policy page", title: "Callback requested", body: "Europ Assistance will call you on [number] within 10 minutes. Keep your phone nearby.", link: "Link: Edit request" },
    { ch: "push", title: "We've got your request", body: "Europ Assistance will call you on [number] within 10 minutes. Keep your phone nearby.", link: "Opens: Callback summary" },
    { ch: "wa", label: "WhatsApp · confirmation + more help", thread: [
      { from: "bot", text: "*We've got your request*\n\nSomeone from Europ Assistance will call you back within 10 minutes. Please keep your phone nearby and be ready to pick up. You don't need to do anything else.\n\nCalling you on [number]\n\nCan't take calls on this number? Email [Europ Assistance email].\n\nWhile you wait:",
        buttons: ["Find cashless hospitals near me ↗", "View medical e-card ↗", "Talk to a doctor online ↗"] } ] },
    { ch: "email", to: "Europ Assistance (configured recipients) · Cc: configured", subject: "Callback request – ACKO travel policy [Policy ID] – [Member name]",
      body: "Callback request received from the ACKO Medical E-Card.\n\nRequested at: [Date and time, timezone]\nPolicy ID: [Policy ID]\nAffected traveller: [Member name]\nCallback number: [Confirmed number]\nDestination and coverage: [Destination] | [start date]–[end date]\nWhat happened?: [Chip and note, if provided]\nHospital: [Name, if provided]\nLocation: [Address or pin, if provided]\nHospital contact: [Name, phone or email, if provided]\n\nPlease call [Member name] on [Confirmed number] about their request." },
  ],
},
{
  id: "t2", phase: "post", row: "tap", col: 8, when: "Any e-card action after trip end",
  title: "Stay quiet",
  trigger: "Trip has ended. Customer tries to open the e-card, download it, call from it or share it.",
  why: "The e-card is gone. We say nothing.",
  rules: [],
  analytics: ["medical_ecard_viewed (post-trip)"],
  msgs: [
    { ch: "inapp", label: "Nothing sent", title: "No message", body: "No WhatsApp, push or email. No view, download, call or callback on the e-card after the trip ends." },
  ],
},
];
