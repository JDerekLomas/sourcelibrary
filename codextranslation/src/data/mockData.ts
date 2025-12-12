import { Page, Version } from '../types';

export const mockPages: Page[] = [
  {
    id: 'page-1',
    pageNumber: 1,
    imageUrl: 'https://ia800909.us.archive.org/BookReader/BookReaderImages.php?zip=/19/items/DeVitaLibriTres/De_vita_libri_tres_jp2.zip&file=De_vita_libri_tres_jp2/De_vita_libri_tres_0000.jp2&scale=3&rotate=0',
    ocrText: `PROOEMIUM FRATRIS HIERONYMI SAVONAROLAE DE FERRARIA ORDINIS PRAEDICATORUM IN EXPOSITIONEM ORATIONIS DOMINICAE AD MOROSINAM SPONSAM SUAM.
HIERONYMUS servus Iesu Christi inutilis, dilectissimae in Christo filiae, et sponsae eiusdem Dei et Salvatoris nostri Iesu Christi, salutem et perpetuam consolationem.
Cogitanti mihi, filia mea dilectissima, quidnam potissimum pro mea tenuitate tuis sanctis desideriis offerrem, ut et meae in te charitatis et tuae in me devotionis aliquod extaret testimonium, illud tandem Saladini in mentem venit, qui cum infinito auri et argenti pondere premeretur, et innumerabilibusque thesauris afflueret, nihil se habere in rebus humanis dicebat, quo magnificum et excelsum animum suum erga nobilem virum ostenderet, nisi hortulum suum, quem propriis manibus colebat.`,
    translationText: `PREFACE OF BROTHER GIROLAMO SAVONAROLA OF FERRARA OF THE ORDER OF PREACHERS ON THE EXPOSITION OF THE LORD'S PRAYER TO MOROSINA HIS BRIDE.
GIROLAMO, an unprofitable servant of Jesus Christ, to his most beloved daughter in Christ, and bride of the same God and our Savior Jesus Christ, health and perpetual consolation.
While I was considering, my most beloved daughter, what in particular, for my littleness, I might offer to your holy desires, so that there might exist some testimony of my charity towards you and of your devotion to me, that saying of Saladin finally came to mind, who, though he was burdened with an infinite weight of gold and silver, and flowed with innumerable treasures, said that he had nothing in human affairs by which he might show his magnificent and lofty spirit towards a noble man, except his own little garden, which he cultivated with his own hands.`
  },
  {
    id: 'page-2',
    pageNumber: 2,
    imageUrl: 'https://ia800909.us.archive.org/BookReader/BookReaderImages.php?zip=/19/items/DeVitaLibriTres/De_vita_libri_tres_jp2.zip&file=De_vita_libri_tres_jp2/De_vita_libri_tres_0001.jp2&scale=3&rotate=0',
    ocrText: 'Page 2 OCR text goes here.',
    translationText: 'Page 2 translation goes here.'
  },
  {
    id: 'page-3',
    pageNumber: 3,
    imageUrl: 'https://ia800909.us.archive.org/BookReader/BookReaderImages.php?zip=/19/items/DeVitaLibriTres/De_vita_libri_tres_jp2.zip&file=De_vita_libri_tres_jp2/De_vita_libri_tres_0002.jp2&scale=3&rotate=0',
    ocrText: 'Page 3 OCR text goes here.',
    translationText: 'Page 3 translation goes here.'
  }
];

export const mockVersions: Version[] = [
    {
      id: 'ver-1',
      name: 'Initial Draft',
      timestamp: '2023-10-27T10:00:00Z',
    },
    {
      id: 'ver-2',
      name: 'Revised by Admin',
      timestamp: '2023-10-27T14:30:00Z',
    },
];