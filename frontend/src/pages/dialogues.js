const dialogues = {
  stage1: [
    // Unchanged Stage 1 dialogues
    {
      id: "N/A",
      char: "inspector",
      text: "Good morning, Detective. You're right on time.",
    },
    {
      id: "N/A",
      char: "detective",
      text: "Morning, Inspector. What’s the situation so far?",
    },
    {
      id: "N/A",
      char: "inspector",
      text: "The victim's body has been transported for forensic examination.",
    },
    {
      id: "N/A",
      char: "inspector",
      text: "We expect the preliminary findings to arrive shortly.",
    },
    {
      id: "N/A",
      char: "inspector",
      text: "In the meantime, my team has completed a comprehensive search of the premises.",
    },
    {
      id: "N/A",
      char: "detective",
      text: "Was anything unusual discovered? Any missing items of interest?",
    },
    {
      id: "N/A",
      char: "inspector",
      text: "Yes. Several personal items have been reported missing from Miss Rose's residence.",
    },
    {
      id: "N/A",
      char: "inspector",
      text: "However, none appear to possess significant monetary value. Therefore, robbery does not seem to be the motive.",
    },
    {
      id: "candlestick",
      char: "inspector",
      text: "Among the missing items is a candlestick that was typically kept in the living room showcase,",
    },
    {
      id: "wrench",
      char: "inspector",
      text: "Additionally, a wrench from the garage toolbox has not been accounted for,",
    },
    {
      id: "rope",
      char: "inspector",
      text: "A coil of rope that usually hung in the backyard shed also appears to be missing,",
    },
    {
      id: "pipe",
      char: "inspector",
      text: "A metal pipe, previously stored among the basement plumbing supplies, is no longer present,",
    },
    {
      id: "revolver",
      char: "inspector",
      text: "Curiously, a vintage revolver that was displayed in the study seems to have vanished as well,",
    },
    {
      id: "knife",
      char: "inspector",
      text: "Lastly, one of the kitchen knives from the primary cutlery set is unaccounted for,",
    },
    {
      id: "N/A",
      char: "inspector",
      text: "It is plausible that one of these items may have been used as the murder weapon.",
    },
    {
      id: "weapons",
      char: "inspector",
      text: "We are continuing to examine the scene for additional physical evidence and will keep you informed of any developments.",
    },
    {
      id: "N/A",
      char: "detective",
      text: "Understood. Keep me updated, Inspector. I’ll begin interviewing the suspects in the meantime.",
    },
  ],

  stage2: {
    chris: [
      /*{ id: "intro", char: "detective", text: "You're Chris Blaine—28, tall at 6 feet 3 inches, black hair, blue eyes, CEO by title." },
      { id: "intro", char: "chris", text: "Tall, dark, and suspicious, huh? You forgot charming." },
      { id: "alibi", char: "detective", text: "Where were you last night, Mr. CEO?" },
      // Backend alibi response will be inserted here
      { id: "alibi", char: "chris", text: "Dynamic alibi response will be inserted here." }, // Placeholder
      // Backend follow-up and rebuttal will be inserted here
      { id: "alibi", char: "detective", text: "Dynamic follow-up response will be inserted here." }, // Placeholder
      { id: "alibi", char: "chris", text: "Dynamic rebuttal response will be inserted here." }, // Placeholder
       */
      { id: "alibi", char: "detective", text: "Quiet nights tend to get loud when someone's trying to hide something." },
      { id: "alibi", char: "detective", text: "Maybe she knew something about your... offshore accounts?" },
      { id: "alibi", char: "chris", text: "Scoff-worthy, detective. If I were hiding skeletons, they’d be better dressed." },
      { id: "motive", char: "detective", text: "Tell me, Chris—why wouldn’t you kill the victim?" },
      { id: "motive", char: "chris", text: "Because I respected her. She left the company on her own terms. No lawsuit, no bad blood." },
      { id: "motive", char: "chris", text: "She was sharp—I even offered her a return package once." },
    ],

    jason: [
     /* { id: "intro", char: "detective", text: "Jason Blue—31, 5 feet 11 inches, brown hair, blue eyes. A singer, I believe?" },
      { id: "intro", char: "jason", text: "Don’t worry, detective, I only kill with high notes." },
      { id: "alibi", char: "detective", text: "Your alibi, Mr. Blue?" },
      { id: "alibi", char: "jason", text: "Dynamic alibi response will be inserted here." },
      { id: "alibi", char: "detective", text: "Dynamic follow-up response will be inserted here." },
      { id: "alibi", char: "jason", text: "Dynamic rebuttal response will be inserted here." },
       */
      { id: "alibi", char: "detective", text: "Quiet nights tend to get loud when someone's trying to hide something." },
       
      { id: "alibi", char: "detective", text: "Maybe you got jealous seeing her with someone else?" },
      { id: "alibi", char: "jason", text: "*Concerned look* That’s a painful thought—but no. She moved on, and I respected that." },
      { id: "motive", char: "detective", text: "So tell me—why wouldn’t you kill her?" },
      { id: "motive", char: "jason", text: "Because I loved her. Even after the breakup." },
      { id: "motive", char: "jason", text: "I wrote her into every song, even the sad ones. She was... unforgettable." },
    ],

    kate: [
     /* { id: "intro", char: "detective", text: "Kate Ivory—35, 5 feet 8 inches, black hair, brown eyes. Banker by profession." },
      { id: "intro", char: "kate", text: "Sounds like a profile from a loan application." },
      { id: "intro", char: "kate", text: "Hope this interview doesn’t come with hidden charges." },
      { id: "alibi", char: "detective", text: "Your alibi, Ms. Ivory?" },
      { id: "alibi", char: "kate", text: "Dynamic alibi response will be inserted here." },
      { id: "alibi", char: "detective", text: "Dynamic follow-up response will be inserted here." },
      { id: "alibi", char: "kate", text: "Dynamic rebuttal response will be inserted here." },
       */
      { id: "alibi", char: "detective", text: "Quiet nights tend to get loud when someone's trying to hide something." },
      { id: "alibi", char: "detective", text: "Or maybe you were still angry about how she handled the divorce." },
      { id: "alibi", char: "kate", text: "*Sighs* I’m not proud of everything, but anger doesn’t equal murder." },
      { id: "motive", char: "detective", text: "Why wouldn’t you kill her, Kate?" },
      { id: "motive", char: "kate", text: "Because I’ve lost her once. Divorce was painful enough." },
      { id: "motive", char: "kate", text: "We were civil after everything. I had no reason to hurt her." },
    ],

    poppy: [
     /* { id: "intro", char: "detective", text: "Poppy Green—26, 5 feet 5 inches, brown hair, green eyes. A model, correct?" },
      { id: "intro", char: "poppy", text: "So you’ve done your homework. Let’s hope it wasn’t for a gossip column." },
      { id: "alibi", char: "detective", text: "And where were you last night?" },
      { id: "alibi", char: "poppy", text: "Dynamic alibi response will be inserted here." },
      { id: "alibi", char: "detective", text: "Dynamic follow-up response will be inserted here." },
      { id: "alibi", char: "poppy", text: "Dynamic rebuttal response will be inserted here." },
       */
      { id: "alibi", char: "detective", text: "Quiet nights tend to get loud when someone's trying to hide something." },
      { id: "alibi", char: "detective", text: "Or maybe you thought she was about to outshine you in the industry?" },
      { id: "alibi", char: "poppy", text: "*Scoffs* She was good—but there’s room on the runway for two." },
      { id: "motive", char: "detective", text: "So why wouldn’t you do it, Poppy?" },
      { id: "motive", char: "poppy", text: "We worked together. She was competitive, sure, but we laughed between takes." },
      { id: "motive", char: "poppy", text: "She gave me posing tips. You don’t kill people who help you shine." },
    ],

    violet: [
     /* { id: "intro", char: "detective", text: "Violet Riley—27, 5 feet 9 inches, blonde hair, brown eyes. Florist by trade." },
      { id: "intro", char: "violet", text: "I arrange flowers, not funerals. Just so we’re clear." },
      { id: "alibi", char: "detective", text: "Then tell me where you were." },
      { id: "alibi", char: "violet", text: "Dynamic alibi response will be inserted here." },
      { id: "alibi", char: "detective", text: "Dynamic follow-up response will be inserted here." },
      { id: "alibi", char: "violet", text: "Dynamic rebuttal response will be inserted here." },
       */
      { id: "alibi", char: "detective", text: "Quiet nights tend to get loud when someone's trying to hide something." },
      { id: "alibi", char: "detective", text: "Maybe jealousy turned darker than you admit?" },
      { id: "alibi", char: "violet", text: "*Nervous* Jealous? Sure. But murderous? That’s a leap, detective." },
      { id: "motive", char: "detective", text: "Why wouldn’t you harm your best friend?" },
      { id: "motive", char: "violet", text: "We’ve known each other since braces and breakouts. She was the maid of honor at my wedding." },
      { id: "motive", char: "violet", text: "I may have wanted to throttle her sometimes—but kill her? Never." },
    ],

    zehab: [
     /* { id: "intro", char: "detective", text: "Zehab Rose—22, 5 feet 5 inches, brown hair, brown eyes. A writer, with a flair for drama?" },
      { id: "intro", char: "zehab", text: "Writers imagine murders—they don’t commit them. At least not outside the pages." },
      { id: "alibi", char: "detective", text: "So what’s your alibi, Ms. Rose?" },
      { id: "alibi", char: "zehab", text: "Dynamic alibi response will be inserted here." },
      { id: "alibi", char: "detective", text: "Dynamic follow-up response will be inserted here." },
      { id: "alibi", char: "zehab", text: "Dynamic rebuttal response will be inserted here." },
       */
      { id: "alibi", char: "detective", text: "Quiet nights tend to get loud when someone's trying to hide something." },
      { id: "alibi", char: "detective", text: "Or maybe she rejected your latest manuscript and you snapped?" },
      { id: "alibi", char: "zehab", text: "*Nervously chuckles* Wow. That’s dark—even for me. No, she was my best critic." },
      { id: "motive", char: "detective", text: "Why wouldn’t you do it, Zehab?" },
      { id: "motive", char: "zehab", text: "She was my sister. Not by blood, but she still read my drafts, told me when my prose sucked." },
      { id: "motive", char: "zehab", text: "We fought like siblings do, but family is family." },
    ],
  },

  /*stage3: {
    // Stage 3 dialogues will be dynamically generated in GamePlay.jsx
  }, */
};

export default dialogues;