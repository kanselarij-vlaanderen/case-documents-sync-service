const GRAPH = 'http://mu.semte.ch/graphs/organizations/kanselarij';

const CASE_TYPE = 'https://data.vlaanderen.be/ns/dossier#Dossier';
const CASE_DOC_PREDICATE = 'https://data.vlaanderen.be/ns/dossier#Dossier.bestaatUit';
const CASE_FIELD_PREDICATE = 'http://data.vlaanderen.be/ns/besluitvorming#beleidsveld';

const WATCH_TYPES = [
  {
    type: 'http://data.vlaanderen.be/ns/besluit#Agendapunt',
    predicateToObject: { uri: 'http://data.vlaanderen.be/ns/besluitvorming#geagendeerdStuk', inverse: false },
    pathToCase: [
      { uri: 'http://data.vlaanderen.be/ns/besluitvorming#genereertAgendapunt', inverse: true },
      { uri: 'http://data.vlaanderen.be/ns/besluitvorming#vindtPlaatsTijdens', inverse: false },
      { uri: 'https://data.vlaanderen.be/ns/dossier#doorloopt', inverse: true }
    ],
    casePredicate: CASE_DOC_PREDICATE
  },
  {
    type: 'http://mu.semte.ch/vocabularies/ext/Indieningsactiviteit',
    predicateToObject: { uri: 'http://www.w3.org/ns/prov#generated', inverse: false },
    pathToCase: [
      { uri: 'http://mu.semte.ch/vocabularies/ext/indieningVindtPlaatsTijdens', inverse: false },
      { uri: 'https://data.vlaanderen.be/ns/dossier#doorloopt', inverse: true }
    ],
    casePredicate: CASE_DOC_PREDICATE
  },
  {
    type: 'https://data.vlaanderen.be/ns/dossier#Procedurestap',
    predicateToObject: { uri: 'http://data.vlaanderen.be/ns/besluitvorming#beleidsveld', inverse: false },
    pathToCase: [
      { uri: 'https://data.vlaanderen.be/ns/dossier#doorloopt', inverse: true }
    ],
    casePredicate: CASE_FIELD_PREDICATE
  }
];

const UPDATEABLE_PREDICATES = WATCH_TYPES.map(t => t.predicateToObject.uri);

module.exports = {
  GRAPH,
  CASE_TYPE,
  CASE_DOC_PREDICATE,
  CASE_FIELD_PREDICATE,
  WATCH_TYPES,
  UPDATEABLE_PREDICATES
};
