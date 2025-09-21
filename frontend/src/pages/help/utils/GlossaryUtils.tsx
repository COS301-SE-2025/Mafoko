import { SectionProps } from '../types.ts';

export const GlossaryContent: SectionProps[] = [
  {
    id: 'search',
    title: 'Searching for a Glossary',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Use the <strong>search bar</strong> to quickly find a glossary by
          name. As you type, matching glossaries will be returned for you to
          open.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'view',
    title: 'Viewing a Glossary',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Click the <strong>View</strong> button on any glossary card to open it
          and see the terms inside.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'filter',
    title: 'Filtering Glossaries',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Use the <strong>Filter</strong> option to limit results to specific
          languages. This is helpful if you only want to see terms in certain
          languages.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'translation-bank',
    title: 'Using the Translation Bank',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Click the <strong>View Translations</strong> button on a term to see
          all available translations for that entry.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'exporting',
    title: 'Exporting Data from a Glossary',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          You can export glossary data based on your current filters. Marito
          supports multiple formats so you can use the data in different tools.
          Exported files always reflect the filters you applied.
        </p>

        <ol className="list-decimal list-inside space-y-2 mt-4">
          <li>
            <strong>Choose a Glossary:</strong> Select the glossary you want to
            export, and apply filters if needed.
          </li>
          <li>
            <strong>Click Export:</strong> Tap the export button on the glossary
            card or from inside the glossary view.
          </li>
          <li>
            <strong>Select a Format:</strong> Pick how you’d like to download
            the data:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>
                <strong>CSV</strong>
              </li>
              <li>
                <strong>JSON</strong>
              </li>
              <li>
                <strong>HTML</strong>
              </li>
              <li>
                <strong>PDF</strong>
              </li>
            </ul>
          </li>
        </ol>
      </div>
    ),
    assetLocation: '',
  },
];
