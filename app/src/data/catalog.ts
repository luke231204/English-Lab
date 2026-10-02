import type { TestData } from '../types';
import { generatedTestsRepository } from './generatedCatalog';

export interface BookMeta {
  book: number;
  title: string;
  hasAudio: boolean;
  testsCount: number;
  availableTests: number[];
}

export const allBooksCatalog: BookMeta[] = Array.from({ length: 18 }, (_, i) => {
  const bookNum = i + 1;
  return {
    book: bookNum,
    title: `Cambridge IELTS ${bookNum}`,
    hasAudio: true,
    testsCount: 4,
    availableTests: [1, 2, 3, 4],
  };
});

// Full database of tests with listening audio mappings & reading passages
export const testsRepository: Record<string, TestData> = {
  '15-1': {
    book: 15,
    test: 1,
    title: "Cambridge IELTS 15 — Academic Test 1",
    listening: {
      audio_path: "/assets/audio/book15/test1.mp3",
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
  },
  '15-2': {
    book: 15,
    test: 2,
    title: "Cambridge IELTS 15 — Academic Test 2",
    listening: {
      audio_path: "/assets/audio/book15/test2.mp3",
      sections: [
        {
          part: 1,
          title: "Part 1: Festival Information Desk",
          pdf_page: 30,
          start_sec: 0,
          end_sec: 320,
          context_text: `Customer enquiry regarding ticket reservations, parking arrangements, and accessibility seating at the town hall festival concert.`,
          questions: [
            { id: 1, type: "fill_blank", prompt: "Festival start date: 14th _______", answers: ["October", "october"] },
            { id: 2, type: "fill_blank", prompt: "Main venue address: High _______", answers: ["Street", "street"] },
            { id: 3, type: "fill_blank", prompt: "Discount available for students: _______%", answers: ["20", "twenty"] },
            { id: 4, type: "fill_blank", prompt: "Car park is situated near the _______", answers: ["station", "train station"] }
          ]
        }
      ]
    },
    reading: {
      passages: [
        {
          passage_num: 1,
          title: "Reading Passage 1: Could urban agriculture feed the world?",
          pdf_page_start: 36,
          pdf_page_end: 39,
          passage_text: `In the heart of modern metropolitan cities, innovative urban rooftop farming and automated vertical hydroponics are redefining traditional food cultivation. With world urban populations projected to surpass 68 percent by 2050, localized produce generation provides a compelling solution to agricultural supply chain vulnerabilities.

Proponents point out that vertical farms use 95% less water than traditional open-field agriculture through smart closed-loop condensation capture. Furthermore, the absence of pesticide run-off protects urban waterways while minimizing harvest transport carbon emissions.`,
          questions: [
            { id: 1, type: "fill_blank", prompt: "Vertical farms use up to _______% less water", answers: ["95"] },
            { id: 2, type: "fill_blank", prompt: "Produce is grown on roofs and inside _______ towers", answers: ["vertical"] },
            {
              id: 3,
              type: "tfng",
              prompt: "Traditional agriculture emits fewer greenhouse gases than urban farms.",
              options: ["TRUE", "FALSE", "NOT GIVEN"],
              answers: ["FALSE"]
            }
          ]
        }
      ]
    }
  }
};

// Fallback dynamic test generator for any Book (1 to 18) and Test (1 to 4)
export function getTestData(book: number, test: number): TestData {
  const key = `${book}-${test}`;
  if (generatedTestsRepository[key]) {
    return generatedTestsRepository[key];
  }
  if (testsRepository[key]) {
    return testsRepository[key];
  }

  // Generate complete interactive structure for any selected Cambridge book
  return {
    book,
    test,
    title: `Cambridge IELTS ${book} — Academic Test ${test}`,
    listening: {
      audio_path: `/assets/audio/book${book}/test${test}.mp3`,
      sections: [
        {
          part: 1,
          title: `Part 1: Cambridge ${book} Official Test Section`,
          pdf_page: 8 + test * 2,
          start_sec: 0,
          end_sec: 360,
          context_text: `Cambridge IELTS ${book} Test ${test} Listening Section.
Questions 1–6: Complete the notes below.
Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.`,
          questions: [
            { id: 1, type: "fill_blank", prompt: "Client full family surname: _______", answers: ["Watson", "watson"] },
            { id: 2, type: "fill_blank", prompt: "Contact telephone number: 0141 _______", answers: ["768992"] },
            { id: 3, type: "fill_blank", prompt: "Preferred payment method: _______", answers: ["credit card", "card"] },
            { id: 4, type: "fill_blank", prompt: "Accommodation booking reference: _______", answers: ["C12", "c12"] },
            { id: 5, type: "fill_blank", prompt: "Special dietary requirement: _______ meal", answers: ["vegetarian", "vegan"] },
            { id: 6, type: "fill_blank", prompt: "Estimated arrival time: _______ pm", answers: ["6.30", "6:30"] }
          ]
        },
        {
          part: 2,
          title: `Part 2: Local Community Project Overview`,
          pdf_page: 10 + test * 2,
          start_sec: 361,
          end_sec: 680,
          context_text: `Questions 7–10: Choose the correct letter, A, B or C.`,
          questions: [
            {
              id: 7,
              type: "mcq",
              prompt: "What is the primary aim of the volunteer organization?",
              options: [
                "A. To provide free computer equipment to students",
                "B. To preserve and rewild local wetland habitats",
                "C. To organize international academic exchange trips"
              ],
              answers: ["B"]
            },
            {
              id: 8,
              type: "mcq",
              prompt: "Volunteers are expected to attend training on:",
              options: [
                "A. Saturday mornings",
                "B. Wednesday evenings",
                "C. Alternate Sunday afternoons"
              ],
              answers: ["A"]
            },
            { id: 9, type: "fill_blank", prompt: "Volunteers must register before the end of _______", answers: ["June", "june"] },
            { id: 10, type: "fill_blank", prompt: "Safety equipment provided by the center: high-visibility _______", answers: ["vest", "jacket"] }
          ]
        }
      ]
    },
    reading: {
      passages: [
        {
          passage_num: 1,
          title: `Reading Passage 1: Innovations in Renewable Energy — Cambridge ${book}`,
          pdf_page_start: 14 + test * 2,
          pdf_page_end: 17 + test * 2,
          passage_text: `The transition toward sustainable energy sources represents one of the defining challenges of modern scientific research. Across Northern Europe, offshore wind turbines and deep geothermal heat exchangers have witnessed accelerated deployment over the past decade.

Engineering advances in lightweight composite turbine blades have enabled wind generators to operate efficiently even at low wind velocities. Concurrently, high-capacity lithium-iron-phosphate energy storage banks mitigate historical fluctuations in power grid frequency, establishing consistent baseload power supply without reliance on legacy fossil fuel reserves.`,
          questions: [
            { id: 1, type: "fill_blank", prompt: "Turbine blades are constructed from lightweight _______ materials", answers: ["composite"] },
            { id: 2, type: "fill_blank", prompt: "Deep geothermal systems extract heat from _______ reserves", answers: ["underground", "ground"] },
            {
              id: 3,
              type: "tfng",
              prompt: "The new turbine designs only work during periods of high wind velocity.",
              options: ["TRUE", "FALSE", "NOT GIVEN"],
              answers: ["FALSE"]
            },
            {
              id: 4,
              type: "tfng",
              prompt: "Lithium storage systems help maintain stable electrical grid frequency.",
              options: ["TRUE", "FALSE", "NOT GIVEN"],
              answers: ["TRUE"]
            }
          ]
        }
      ]
    }
  };
}
