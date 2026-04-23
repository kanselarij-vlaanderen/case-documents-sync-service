import { updateSudo } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';
import { CASE_TYPE, CASE_DOC_PREDICATE, WATCH_TYPES, AGENDAPUNT_TYPE, INDIENINGSACTIVITEIT_TYPE } from './config';
import { relationPathForType } from './lib/query-util';

async function syncDocsForSubjectInGraph (subject, type, graph) {
  const { predicateToDoc } = WATCH_TYPES.find(t => t.type === type);
  const queryString = `
INSERT {
    GRAPH ${sparqlEscapeUri(graph)} {
        ?case ${sparqlEscapeUri(CASE_DOC_PREDICATE)} ?doc .
    }
}
WHERE {
    GRAPH ${sparqlEscapeUri(graph)} {
        ?case a ${sparqlEscapeUri(CASE_TYPE)} .
        ${sparqlEscapeUri(subject)} ${relationPathForType(type)} ?case .
        ${sparqlEscapeUri(subject)} ${sparqlEscapeUri(predicateToDoc.uri)} ?doc .
        FILTER NOT EXISTS {
            ?case ${sparqlEscapeUri(CASE_DOC_PREDICATE)} ?doc .
        }
    }
}
  `;
  await updateSudo(queryString);
}

async function syncCaseDocsFromAgendapunten () {
  const watchType = WATCH_TYPES.find(t => t.type === AGENDAPUNT_TYPE);
  const geagendeerdStuk = watchType.predicateToDoc.uri;
  const [genereertAgendapunt, vindtPlaatsTijdens, doorloopt, isNeerslagVan] = watchType.pathToCase.map(p => p.uri);

  const queryString = `
INSERT {
  GRAPH ?g {
    ?case ${sparqlEscapeUri(CASE_DOC_PREDICATE)} ?doc .
  }
} WHERE {
  GRAPH ?g {
    ?agendaitem a ${sparqlEscapeUri(AGENDAPUNT_TYPE)} ;
                ${sparqlEscapeUri(geagendeerdStuk)} ?doc .
    ?agendaActivity ${sparqlEscapeUri(genereertAgendapunt)} ?agendaitem ;
                    ${sparqlEscapeUri(vindtPlaatsTijdens)} ?subcase .
    ?decisionFlow ${sparqlEscapeUri(doorloopt)} ?subcase .
    ?case ${sparqlEscapeUri(isNeerslagVan)} ?decisionFlow .
    FILTER NOT EXISTS { ?case ${sparqlEscapeUri(CASE_DOC_PREDICATE)} ?doc }
  }
}
  `;
  await updateSudo(queryString);
}

async function syncCaseDocsFromIndieningen () {
  const watchType = WATCH_TYPES.find(t => t.type === INDIENINGSACTIVITEIT_TYPE);
  const generated = watchType.predicateToDoc.uri;
  const [indieningVindtPlaatsTijdens, doorloopt, isNeerslagVan] = watchType.pathToCase.map(p => p.uri);

  const queryString = `
INSERT {
  GRAPH ?g {
    ?case ${sparqlEscapeUri(CASE_DOC_PREDICATE)} ?doc .
  }
} WHERE {
  GRAPH ?g {
    ?submission a ${sparqlEscapeUri(INDIENINGSACTIVITEIT_TYPE)} ;
                ${sparqlEscapeUri(generated)} ?doc .
    ?submission ${sparqlEscapeUri(indieningVindtPlaatsTijdens)} ?subcase .
    ?decisionFlow ${sparqlEscapeUri(doorloopt)} ?subcase .
    ?case ${sparqlEscapeUri(isNeerslagVan)} ?decisionFlow .
    FILTER NOT EXISTS { ?case ${sparqlEscapeUri(CASE_DOC_PREDICATE)} ?doc }
  }
}
  `;
  await updateSudo(queryString);
}

async function syncAllCaseDocs () {
  await syncCaseDocsFromAgendapunten();
  await syncCaseDocsFromIndieningen();
}

module.exports = {
  syncDocsForSubjectInGraph,
  syncCaseDocsFromAgendapunten,
  syncCaseDocsFromIndieningen,
  syncAllCaseDocs,
};
