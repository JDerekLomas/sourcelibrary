import { PageDetails } from "../types";

// Sample OCR text (German - from an alchemical text)
const sampleOcrText = `ocrHere 10 Sie nannten also die Trigonen der 12 Himmelszeichen den ersten ♈ ♌ ♐ Warm. den zweyten ♉ ♍ ♑ Trocken. den dritten ♊ ♎ ♒ Feucht. den vierten ♋ ♏ ♓ Kalt. Die Folgen dieser Wirkungen nannten sie Cholera Melancholey. Blut. Schleim. Folglich die Thaten, die aus solchen Beschaffenheiten entspringen, Gewalt. Langsamkeit. Surtigkeit. Trägheit. Die Trigonen, in welchen die 7 Planeten ihre Aspekten zeigen und jeder von ihnen seinen Umlauf verrichtet, mußten sie natürlicher Weise auf die Idee bringen, daß sie den Planeten gewisse ihrem langsa men oder geschwinden Laufe, und den daher gefol gerten Wirkungen entsprechende einzelne Himmelszei chen, als Lieblingsregionen anwiesen. Daher kam es, daß sie auch den Planeten folgende Eigenschaft ten zutheilten. ♄ — Aratron — kalt und trocken ♃ — Petor — feucht und warm ♂ — Phalee — warm und trocken ☉ — Och — warm und trocken ♀ — Hagith — feucht und warm ☿ — Ophiel — nach Beschaffenheit der Nachbarn ☽ — Phul — kalt und feucht.

Eben 11 Eben diese Beschaffenheiten beurtheilten sie in den Ele menten Erde ▽ trocken ▽ kalt Wasser ▽ feucht ▽ kalt Luft ★ feucht ★ warm Feuer △ trocken △ warm.

Immerdar in dieser Eintheilung von vier fort schreitend untertheilten sie den Zodiak in die vier Tri plizitäten oder Trigonen — Feuer — Wasser — Luft — Erde. Den ersten Trigonus nannten sie den feurigen nemlich ♈ ♌ ♐. Den zweyten den Irdischen ♉ ♍ ♑. Den dritten den luftigen ♊ ♎ ♒.`;

// Sample translation text (English)
const sampleTranslationText = `Here 10 So they named the trigons of the 12 celestial signs the first ♈ ♌ ♐ Warm. the second ♉ ♍ ♑ Dry. the third ♊ ♎ ♒ Moist. the fourth ♋ ♏ ♓ Cold. They named the consequences of these effects Cholera Melancholy. Blood. Phlegm. Consequently the deeds that arise from such qualities arise, Violence. Slowness. Haste. Lethargy. The trigons, in which the 7 planets show their aspects and each of them completes its orbit, must have naturally led them to the idea that they assigned to the planets certain individual celestial signs corresponding to their slow or fast movement, and the effects consequently derived from them, as favorite regions. Hence it came that they also assigned the planets the following qualities. ♄ — Aratron — cold and dry ♃ — Petor — moist and warm ♂ — Phalee — warm and dry ☉ — Och — warm and dry ♀ — Hagith — moist and warm ☿ — Ophiel — according to the nature of its neighbors ☽ — Phul — cold and moist.

Likewise 11 They judged these very qualities in the elements Earth ▽ dry ▽ cold Water ▽ moist ▽ cold Air ★ moist ★ warm Fire △ dry △ warm.

Always proceeding in this division of four, they subdivided the Zodiac into the four Triplicities or Trigons — Fire — Water — Air — Earth. They called the first trigon the fiery one, namely ♈ ♌ ♐. The second the Earthy ♉ ♍ ♑. The third the airy ♊ ♎ ♒.`;

// Sample page image URL (a public domain manuscript page)
const sampleImageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Anatomical_chart%2C_Wellcome_L0013467.jpg/800px-Anatomical_chart%2C_Wellcome_L0013467.jpg";

export const samplePageDetails: PageDetails = {
  id: "demo-page-1",
  book_id: "demo-book-1",
  page_number: 10,
  photo: sampleImageUrl,
  thumbnail: sampleImageUrl,
  compressed_photo: sampleImageUrl,
  ocr: {
    language: "German",
    model: "mistral",
    data: sampleOcrText,
  },
  translation: {
    language: "English",
    model: "gemini",
    data: sampleTranslationText,
  },
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

// Generate a few sample pages for navigation demo
export const samplePages: PageDetails[] = [
  {
    ...samplePageDetails,
    id: "demo-page-1",
    page_number: 1,
  },
  {
    ...samplePageDetails,
    id: "demo-page-2",
    page_number: 2,
    ocr: {
      ...samplePageDetails.ocr,
      data: "Dies ist Seite 2 des Manuskripts. Hier beginnt die Erklärung der himmlischen Einflüsse auf die irdischen Elemente...",
    },
    translation: {
      ...samplePageDetails.translation,
      data: "This is page 2 of the manuscript. Here begins the explanation of celestial influences on earthly elements...",
    },
  },
  {
    ...samplePageDetails,
    id: "demo-page-3",
    page_number: 3,
    ocr: {
      ...samplePageDetails.ocr,
      data: "Seite 3 enthält weitere Beschreibungen der astrologischen Prinzipien und ihrer Anwendung in der Alchemie...",
    },
    translation: {
      ...samplePageDetails.translation,
      data: "Page 3 contains further descriptions of astrological principles and their application in alchemy...",
    },
  },
];

export const sampleBook = {
  id: "demo-book-1",
  title: "Die Lehren der Rosenkreuzer aus dem 16ten und 17ten Jahrhundert",
  display_title: "The Teachings of the Rosicrucians from the 16th and 17th Century",
  author: "Anonymous",
  language: "German",
  pages_count: 61,
  published: "1785-1788",
  thumbnail: sampleImageUrl,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  categories: [],
};

export default samplePages;
