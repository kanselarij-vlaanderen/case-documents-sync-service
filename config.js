const GRAPH = 'http://mu.semte.ch/graphs/organizations/kanselarij';

const CASE_TYPE = 'https://data.vlaanderen.be/ns/dossier#Dossier';
const CASE_DOC_PREDICATE = 'https://data.vlaanderen.be/ns/dossier#Dossier.bestaatUit';

const WATCH_TYPES = [
  {
    type: 'http://data.vlaanderen.be/ns/besluit#Agendapunt',
    predicateToDoc: { uri: 'https://data.vlaanderen.be/ns/besluitvorming#geagendeerdStuk', inverse: false },
    pathToCase: [
      { uri: 'https://data.vlaanderen.be/ns/besluitvorming#genereertAgendapunt', inverse: true },
      { uri: 'https://data.vlaanderen.be/ns/besluitvorming#vindtPlaatsTijdens', inverse: false },
      { uri: 'https://data.vlaanderen.be/ns/dossier#doorloopt', inverse: true },
      { uri: 'https://data.vlaanderen.be/ns/dossier#Dossier.isNeerslagVan', inverse: true }
    ]
  },
  {
    type: 'http://mu.semte.ch/vocabularies/ext/Indieningsactiviteit',
    predicateToDoc: { uri: 'http://www.w3.org/ns/prov#generated', inverse: false },
    pathToCase: [
      { uri: 'http://mu.semte.ch/vocabularies/ext/indieningVindtPlaatsTijdens', inverse: false },
      { uri: 'https://data.vlaanderen.be/ns/dossier#doorloopt', inverse: true },
      { uri: 'https://data.vlaanderen.be/ns/dossier#Dossier.isNeerslagVan', inverse: true }
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
