import type { NormalizedPage } from '@/domain/text/normalization';
import { splitIntoParagraphs } from '@/domain/text/paragraphs';
import { splitIntoSentences } from '@/domain/text/sentences';
import { tokenizeSentence } from '@/domain/text/tokenize';
import type { Paragraph, Sentence, TextDocument, Token } from '@/domain/text/types';

/**
 * Builds the final tokenized document structure from already-normalized,
 * per-page text. A paragraph never spans two pages (each page is
 * paragraph-split independently), so every paragraph and token carries the
 * page it came from. The last token of each paragraph is marked
 * `paragraphEnd`, overriding whatever punctuation it would otherwise have
 * had, since it is the stronger timing/navigation boundary consumed by the
 * RSVP engine.
 */
export function buildTextDocument(normalizedPages: NormalizedPage[]): TextDocument {
  let globalTokenIndex = 0;
  let globalParagraphIndex = 0;

  const paragraphs: Paragraph[] = normalizedPages.flatMap(({ pageNumber, text }) => {
    const paragraphTexts = splitIntoParagraphs(text);

    return paragraphTexts
      .map((paragraphText): Paragraph => {
        const paragraphIndex = globalParagraphIndex;
        globalParagraphIndex += 1;

        const sentenceTexts = splitIntoSentences(paragraphText);

        const sentences: Sentence[] = sentenceTexts
          .map((sentenceText, sentenceIndex) => {
            const wordTokens = tokenizeSentence(sentenceText);

            const tokens: Token[] = wordTokens.map((wordToken, tokenIndexInSentence) => {
              const isLastTokenInParagraph =
                sentenceIndex === sentenceTexts.length - 1 &&
                tokenIndexInSentence === wordTokens.length - 1;

              const token: Token = {
                id: `token-${globalTokenIndex}`,
                text: wordToken.text,
                index: globalTokenIndex,
                sentenceIndex,
                paragraphIndex,
                punctuation: isLastTokenInParagraph ? 'paragraphEnd' : wordToken.punctuation,
                trailingText: wordToken.trailingText,
                pageNumber,
              };

              globalTokenIndex += 1;
              return token;
            });

            return { id: `sentence-${paragraphIndex}-${sentenceIndex}`, tokens };
          })
          .filter((sentence) => sentence.tokens.length > 0);

        return { id: `paragraph-${paragraphIndex}`, sentences, pageNumber };
      })
      .filter((paragraph) => paragraph.sentences.length > 0);
  });

  return { paragraphs };
}
