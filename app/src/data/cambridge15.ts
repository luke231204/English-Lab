import type { TestData } from '../types';

export const cambridge15Test1: TestData = {
  book: 15,
  test: 1,
  title: "Cambridge IELTS 15 — Academic Test 1",
  listening: {
    audio_path: "/assets/audio/c15_test1.mp3",
    sections: [
      {
        part: 1,
        title: "Part 1: Bankside Recruitment Agency",
        pdf_page: 10,
        start_sec: 0,
        end_sec: 345,
        context_text: `Official Instructions:
Answer Questions 1–10. Write ONE WORD AND/OR A NUMBER for each answer.

Bankside Recruitment Agency:
• Agent Name: Becky Jamieson
• Best time to call: afternoons
• Typical roles: clerical, administration, customer service
• Candidate qualifications and requirements`,
        questions: [
          { id: 1, type: "fill_blank", prompt: "Name of agent: Becky _______", answers: ["Jamieson", "jamieson"] },
          { id: 2, type: "fill_blank", prompt: "Best to call her in the _______", answers: ["afternoon", "afternoons"] },
          { id: 3, type: "fill_blank", prompt: "Must have good _______ skills", answers: ["communication"] },
          { id: 4, type: "fill_blank", prompt: "Jobs are usually for at least one _______", answers: ["week"] },
          { id: 5, type: "fill_blank", prompt: "Pay is usually £_______ per hour", answers: ["10", "ten"] },
          { id: 6, type: "fill_blank", prompt: "Wear a _______ to the interview", answers: ["suit"] },
          { id: 7, type: "fill_blank", prompt: "Must bring your _______ to the interview", answers: ["passport"] },
          { id: 8, type: "fill_blank", prompt: "They will ask questions about each applicant's _______", answers: ["personality"] },
          { id: 9, type: "fill_blank", prompt: "The _______ you receive at interview will benefit you", answers: ["feedback"] },
          { id: 10, type: "fill_blank", prompt: "Less _______ is involved in applying for jobs", answers: ["time"] }
        ]
      },
      {
        part: 2,
        title: "Part 2: Matthews Island Holidays",
        pdf_page: 11,
        start_sec: 346,
        end_sec: 680,
        context_text: `Questions 11–14: Choose the correct letter, A, B or C.
Questions 15–16: Write ONE WORD AND/OR A NUMBER for each answer.`,
        questions: [
          {
            id: 11,
            type: "mcq",
            prompt: "According to the speaker, the company:",
            options: [
              "A. has been operating for over twenty years",
              "B. specializes in unusual destinations worldwide",
              "C. guarantees pleasant weather on all tours"
            ],
            answers: ["A"]
          },
          {
            id: 12,
            type: "mcq",
            prompt: "Where can customers meet the tour manager before travelling to the Isle of Man?",
            options: [
              "A. Liverpool airport",
              "B. Heysham ferry terminal",
              "C. Douglas hotel"
            ],
            answers: ["B"]
          },
          {
            id: 13,
            type: "mcq",
            prompt: "How many lunches are included in the price of the holiday?",
            options: [
              "A. none",
              "B. two",
              "C. four"
            ],
            answers: ["A"]
          },
          {
            id: 14,
            type: "mcq",
            prompt: "Customers have to pay extra for:",
            options: [
              "A. travel insurance",
              "B. local transport fees",
              "C. admission to historical sites"
            ],
            answers: ["C"]
          },
          { id: 15, type: "fill_blank", prompt: "Hotel dining room has view of the _______", answers: ["river"] },
          { id: 16, type: "fill_blank", prompt: "Tynwald may have been founded in _______ not 979", answers: ["1422"] }
        ]
      }
    ]
  },
  reading: {
    passages: [
      {
        passage_num: 1,
        title: "Reading Passage 1: Nutmeg - a valuable spice",
        pdf_page_start: 16,
        pdf_page_end: 19,
        passage_text: `The nutmeg tree, Myristica fragrans, is a large evergreen tree native to Southeast Asia. Until the late eighteenth century, it grew only in one place in the world: a small group of islands in the Banda Sea, part of the Moluccas – or Spice Islands – in northeastern Indonesia. The tree is thickly branched with dense foliage of tough, dark green oval leaves, and produces small, yellow, bell-shaped flowers and pale yellow pear-shaped fruit.

The fruit is encased in a fleshy husk. When the fruit is ripe, this husk splits open into two halves along a predetermined line, revealing a shiny dark brown seed coated in a lacy, crimson or purplish covering called an aril. These are the sources of two distinct spices: nutmeg from the dried central seed, and mace from the dried aril.

Nutmeg was a highly prized and costly ingredient in European cuisine in the Middle Ages, used as a flavoring, medicinal compound, and preservative agent. At the time, merchants were eager to find the origins of the spice, but the trade was shrouded in secrecy by Arab and Venetian traders. Throughout the 17th century, the Dutch East India Company (VOC) fiercely fought for monopoly over the Banda Islands to control global distribution, imposing ruthless penalties on unauthorized trading.`,
        questions: [
          { id: 1, type: "fill_blank", prompt: "The leaves of the tree are _______ in shape", answers: ["oval"] },
          { id: 2, type: "fill_blank", prompt: "The _______ surrounds the fruit and breaks open when the fruit is ripe", answers: ["husk"] },
          { id: 3, type: "fill_blank", prompt: "The _______ is used to produce the spice nutmeg", answers: ["seed"] },
          { id: 4, type: "fill_blank", prompt: "The covering known as the aril is used to produce _______", answers: ["mace"] },
          {
            id: 5,
            type: "tfng",
            prompt: "In the Middle Ages, most Europeans knew where nutmeg was grown.",
            options: ["TRUE", "FALSE", "NOT GIVEN"],
            answers: ["FALSE"]
          },
          {
            id: 6,
            type: "tfng",
            prompt: "The VOC was the world's first major trading company.",
            options: ["TRUE", "FALSE", "NOT GIVEN"],
            answers: ["NOT GIVEN"]
          },
          {
            id: 7,
            type: "tfng",
            prompt: "Following the Treaty of Breda, the Dutch had control of all the islands where nutmeg grew.",
            options: ["TRUE", "FALSE", "NOT GIVEN"],
            answers: ["TRUE"]
          }
        ]
      }
    ]
  }
};
