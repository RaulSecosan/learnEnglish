import { Book, VocabularyItem } from '@/types';

export const sampleBookContent = `
Când aveam șase ani, am văzut odată o imagine magnifică, într-o carte despre pădurea virgină, care se numea "Povești trăite". Reprezenta un șarpe boa care înghițea o fiară. Iată copia acelui desen.

În carte se spunea: "Șerpii boa își înghit prada întreagă, fără s-o mestece. După aceea nu se mai pot mișca și dorm șase luni, timpul cât durează digestia lor."

M-am gândit mult atunci la aventurile din junglă și, la rândul meu, am reușit să desenez cu un creion colorat, primul meu desen. Desenul meu numărul 1. Era așa:

Am arătat capodopera mea persoanelor mari și le-am întrebat dacă desenul meu le face frică.

Mi-au răspuns: "De ce să ne facă frică o pălărie?"

Desenul meu nu reprezenta o pălărie. Reprezenta un șarpe boa care digera un elefant. Am desenat atunci interiorul șarpelui boa, pentru ca persoanele mari să poată înțelege. Ele au mereu nevoie de explicații. Desenul meu numărul 2 era așa:

Persoanele mari m-au sfătuit să las deoparte desenele cu șerpi boa, fie închiși, fie deschiși, și să mă interesez mai curând de geografie, istorie, aritmetică și gramatică. Iată cum am abandonat, la vârsta de șase ani, o strălucită carieră de pictor.
`;

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
    language: 'French',
    progress: 35,
    totalPages: 96,
    currentPage: 34,
    lastRead: new Date('2024-01-15'),
    addedAt: new Date('2024-01-01'),
    content: sampleBookContent,
  },
  {
    id: '2',
    title: 'Don Quixote',
    author: 'Miguel de Cervantes',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
    language: 'Spanish',
    progress: 12,
    totalPages: 432,
    currentPage: 52,
    lastRead: new Date('2024-01-10'),
    addedAt: new Date('2024-01-05'),
    content: sampleBookContent,
  },
  {
    id: '3',
    title: 'Die Verwandlung',
    author: 'Franz Kafka',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
    language: 'German',
    progress: 68,
    totalPages: 48,
    currentPage: 33,
    lastRead: new Date('2024-01-14'),
    addedAt: new Date('2023-12-20'),
    content: sampleBookContent,
  },
];

export const mockVocabulary: VocabularyItem[] = [
  {
    id: '1',
    word: 'apprivoiser',
    translation: 'a îmblânzi',
    sentence: 'Tu deviens responsable pour toujours de ce que tu as apprivoisé.',
    sentenceTranslation: 'Devii pentru totdeauna responsabil de ceea ce ai îmblânzit.',
    bookId: '1',
    bookTitle: 'The Little Prince',
    chapter: 'Capitolul XXI',
    position: 1250,
    createdAt: new Date('2024-01-14'),
    lastReviewed: new Date('2024-01-15'),
    reviewCount: 3,
    isKnown: false,
    notes: 'Cuvânt important în contextul relației cu vulpea',
    tags: ['important', 'emoțional'],
  },
  {
    id: '2',
    word: 'étoile',
    translation: 'stea',
    sentence: 'Quand tu regarderas le ciel, la nuit, puisque j\'habiterai dans l\'une d\'elles.',
    sentenceTranslation: 'Când te vei uita la cer, noaptea, pentru că voi locui într-una dintre ele.',
    bookId: '1',
    bookTitle: 'The Little Prince',
    chapter: 'Capitolul XXVI',
    position: 3420,
    createdAt: new Date('2024-01-13'),
    lastReviewed: null,
    reviewCount: 0,
    isKnown: false,
    notes: '',
    tags: ['natură'],
  },
  {
    id: '3',
    word: 'molino',
    translation: 'moară de vânt',
    sentence: 'Mire vuestra merced que aquellos que allí se parecen no son gigantes, sino molinos de viento.',
    sentenceTranslation: 'Uite domniei tale că aceia care se văd acolo nu sunt uriași, ci mori de vânt.',
    bookId: '2',
    bookTitle: 'Don Quixote',
    chapter: 'Capitolul VIII',
    position: 890,
    createdAt: new Date('2024-01-10'),
    lastReviewed: new Date('2024-01-12'),
    reviewCount: 2,
    isKnown: true,
    notes: 'Scenă faimoasă cu morile de vânt',
    tags: ['clasic', 'cunoscut'],
  },
];
