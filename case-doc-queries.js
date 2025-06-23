import { updateSudo } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri, sparqlEscapeString, update } from 'mu';
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

async function syncDocsForCase(caseId) {
  const queryString = `
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

DELETE {
  ?case dossier:Dossier.bestaatUit ?currentDocuments .
}

INSERT {
  ?case dossier:Dossier.bestaatUit ?subcaseDocuments .
}

WHERE {
  ?case a dossier:Dossier ;
        mu:uuid ${sparqlEscapeString(caseId)} .
  OPTIONAL {
    ?case dossier:Dossier.bestaatUit ?currentDocuments .
  }
  OPTIONAL {
    ?case dossier:Dossier.isNeerslagVan ?decisionmakingFlow .
    ?decisionmakingFlow dossier:doorloopt ?subcase .
    ?subcase a dossier:Procedurestap .
    ?submissionActivity a ext:Indieningsactiviteit ;
                        ext:indieningVindtPlaatsTijdens ?subcase ;
                        prov:generated ?subcaseDocuments .
  }

  FILTER NOT EXISTS {
    ?case dossier:Dossier.bestaatUit ?subcaseDocuments .
  }

  FILTER NOT EXISTS {
    ?submissionActivity prov:generated ?currentDocuments .
  }
}
`;

  await update(queryString);
}

module.exports = {
  syncDocsForSubjectInGraph,
  syncDocsForCase
};
