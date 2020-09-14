import { updateSudo } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';
import { CASE_TYPE, CASE_DOC_PREDICATE, WATCH_TYPES } from './config';
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

module.exports = {
  syncDocsForSubjectInGraph
};
