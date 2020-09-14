const GRAPH = 'http://mu.semte.ch/graphs/organizations/kanselarij';

const CASE_TYPE = 'https://data.vlaanderen.be/ns/dossier#Dossier';
const CASE_DOC_PREDICATE = 'https://data.vlaanderen.be/ns/dossier#Dossier.bestaatUit';

const WATCH_TYPES = [
  {
    type: 'http://data.vlaanderen.be/ns/besluit#Agendapunt',
    predicateToDoc: { uri: 'http://mu.semte.ch/vocabularies/ext/bevatAgendapuntDocumentversie', inverse: false }, // Will be updated in future model changes
    pathToCase: [
      { uri: 'http://data.vlaanderen.be/ns/besluitvorming#genereertAgendapunt', inverse: true },
      { uri: 'http://data.vlaanderen.be/ns/besluitvorming#vindtPlaatsTijdens', inverse: false },
      { uri: 'https://data.vlaanderen.be/ns/dossier#doorloopt', inverse: true }
    ]
  },
  {
    type: 'http://dbpedia.org/ontology/UnitOfWork', // Will be updated in future model changes
    predicateToDoc: { uri: 'http://mu.semte.ch/vocabularies/ext/bevatDocumentversie', inverse: false }, // Will be updated in future model changes
    pathToCase: [
      { uri: 'https://data.vlaanderen.be/ns/dossier#doorloopt', inverse: true }
    ]
  }
];

const UPDATEABLE_PREDICATES = WATCH_TYPES.map(t => t.predicateToDoc.uri);

module.exports = {
  GRAPH,
  CASE_TYPE,
  CASE_DOC_PREDICATE,
  WATCH_TYPES,
  UPDATEABLE_PREDICATES
};
