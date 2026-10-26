export interface SampleText {
  id: string;
  title: string;
  category: string;
  author: string;
  wordCount: number;
  text: string;
}

export const SAMPLE_TEXTS: SampleText[] = [
  {
    id: 'speed-reading-science',
    title: 'The Neuroscience of Speed Reading',
    category: 'Science & Cognitive Research',
    author: 'Cognitive Science Review',
    wordCount: 295,
    text: `Speed reading is not merely about moving your eyes faster; it is about fundamentally transforming how the human brain processes visual language. Traditional reading involves subvocalization—the internal voice that silently pronounces every single syllable. While helpful for early language acquisition, subvocalization acts as a biological bottleneck, capping typical reading speed around 200 to 250 words per minute.

When using Rapid Serial Visual Presentation (RSVP), words are flashed sequentially in a fixed visual position. By anchoring each word at its Optimal Recognition Point (ORP)—roughly 30 to 35 percent into the word—your ocular muscles no longer need to execute saccades, the micro-movements of jumping back and forth across a printed page. Saccades typically consume up to 80 percent of total reading time!

Eliminating eye movements enables direct visual-to-cognitive transfer. The visual cortex and Wernicke's area decode recognized word patterns as unified conceptual glyphs rather than acoustic fragments. With dedicated practice, your brain adapts rapidly: comprehension stabilizes, visual cognitive load decreases, and speeds exceeding 500 to 700 words per minute become natural. Track your reading velocity, maintain steady focus, and watch your literacy expand exponentially.`
  },
  {
    id: 'sherlock-holmes',
    title: 'A Scandal in Bohemia (Excerpt)',
    category: 'Classic Literature',
    author: 'Sir Arthur Conan Doyle',
    wordCount: 284,
    text: `To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.

He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position. He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer—excellent for drawing the veil from men's motives and actions. But for the trained reasoner to admit such intrusions into his own delicate and finely adjusted temperament was to introduce a distracting factor which might throw a doubt upon all his mental results.

Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his. And yet there was but one woman to him, and that woman was the late Irene Adler, of dubious and questionable memory.`
  },
  {
    id: 'cosmos-exploration',
    title: 'The Pale Blue Dot',
    category: 'Cosmology & Philosophy',
    author: 'Carl Sagan',
    wordCount: 228,
    text: `Look again at that dot. That's here. That's home. That's us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives.

The aggregate of our joy and suffering, thousands of confident religions, ideologies, and economic doctrines, every hunter and forager, every hero and coward, every creator and destroyer of civilization, every king and peasant, every young couple in love, every mother and father, hopeful child, inventor and explorer, every teacher of morals, every corrupt politician, every superstar, every supreme leader, every saint and sinner in the history of our species lived there—on a mote of dust suspended in a sunbeam.

The Earth is a very small stage in a vast cosmic arena. Think of the rivers of blood spilled by all those generals and emperors so that, in glory and triumph, they could become the momentary masters of a fraction of a dot. Think of the endless cruelties visited by the inhabitants of one corner of this pixel on the scarcely distinguishable inhabitants of some other corner, how frequent their misunderstandings, how eager they are to kill one another, how fervent their hatreds. Our posturings, our imagined self-importance, the delusion that we have some privileged position in the Universe, are challenged by this point of pale light.`
  }
];
