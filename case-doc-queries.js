import { updateSudo } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';
import { CASE_TYPE, WATCH_TYPES } from './config';
import { relationPathForType } from './lib/query-util';

async function syncObjectsForSubjectInGraph (subject, type, graph) {
  const { casePredicate, predicateToObject } = WATCH_TYPES.find(t => t.type === type);
  const queryString = `
INSERT {
    GRAPH ${sparqlEscapeUri(graph)} {
        ?case ${sparqlEscapeUri(casePredicate)} ?object .
    }
}
WHERE {
    GRAPH ${sparqlEscapeUri(graph)} {
        ?case a ${sparqlEscapeUri(CASE_TYPE)} .
        ${sparqlEscapeUri(subject)} ${relationPathForType(type)} ?case .
        ${sparqlEscapeUri(subject)} ${sparqlEscapeUri(predicateToObject.uri)} ?object .
        FILTER NOT EXISTS {
            ?case ${sparqlEscapeUri(casePredicate)} ?object .
        }
    }
}
  `;
  await updateSudo(queryString);
}

async function unsyncObjectsForSubjectInGraph (subject, type, graph) {
  const { casePredicate, predicateToObject } = WATCH_TYPES.find(t => t.type === type);
  const queryString = `
DELETE {
    GRAPH ${sparqlEscapeUri(graph)} {
        ?case ${sparqlEscapeUri(casePredicate)} ?object .
    }
}
WHERE {
    GRAPH ${sparqlEscapeUri(graph)} {
        ?case a ${sparqlEscapeUri(CASE_TYPE)} .
        ?case ${sparqlEscapeUri(casePredicate)} ?object .
        ${sparqlEscapeUri(subject)} ${relationPathForType(type)} ?case .
        ?anySubject ${relationPathForType(type)} ?case .
        FILTER NOT EXISTS {
            ?anySubject ${sparqlEscapeUri(predicateToObject.uri)} ?object .
        }
    }
}
  `;
  await updateSudo(queryString);
}

module.exports = {
  syncObjectsForSubjectInGraph,
  unsyncObjectsForSubjectInGraph
};
