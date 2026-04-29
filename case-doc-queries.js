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
  // delete all documents that don't belong on the case
  const deleteUnrelatedDocumentsQuery = `
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
PREFIX besluitvorming: <https://data.vlaanderen.be/ns/besluitvorming#>

DELETE {
    ?case dossier:Dossier.bestaatUit ?currentDocuments .
}

WHERE {
    ?case a dossier:Dossier ;
          mu:uuid ${sparqlEscapeString(caseId)} ;
          dossier:Dossier.isNeerslagVan ?decisionmakingFlow ;
          dossier:Dossier.bestaatUit ?currentDocuments .

    FILTER NOT EXISTS {
      ?decisionmakingFlow dossier:doorloopt / ^ext:indieningVindtPlaatsTijdens / prov:generated ?currentDocuments .
    }
    FILTER NOT EXISTS {
      ?decisionmakingFlow dossier:doorloopt /
      ^besluitvorming:vindtPlaatsTijdens /
      besluitvorming:genereertAgendapunt /
      besluitvorming:geagendeerdStuk  ?currentDocuments .
    }
}
`;

  // insert all documents connected to subcase via all submission-activities
  const insertSubcaseDocumentsQuery = `
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
PREFIX besluitvorming: <https://data.vlaanderen.be/ns/besluitvorming#>

INSERT {
    ?case dossier:Dossier.bestaatUit ?subcaseDocuments .
}

WHERE {
    ?case a dossier:Dossier ;
          mu:uuid ${sparqlEscapeString(caseId)} ;
          dossier:Dossier.isNeerslagVan ?decisionmakingFlow .

    ?decisionmakingFlow dossier:doorloopt / ^ext:indieningVindtPlaatsTijdens / prov:generated ?subcaseDocuments .

    FILTER NOT EXISTS { ?case dossier:Dossier.bestaatUit ?subcaseDocuments . }
}
  `;

  // insert all documents connected to an agendaitem (these should technically also be connected to the above submission-activities)
  const insertAgendaitemDocumentsQuery= `
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
PREFIX besluitvorming: <https://data.vlaanderen.be/ns/besluitvorming#>

INSERT {
    ?case dossier:Dossier.bestaatUit ?agendaitemDocuments .
}

WHERE {
    ?case a dossier:Dossier ;
          mu:uuid ${sparqlEscapeString(caseId)} ;
          dossier:Dossier.isNeerslagVan ?decisionmakingFlow .

    ?decisionmakingFlow dossier:doorloopt /
    ^besluitvorming:vindtPlaatsTijdens /
    besluitvorming:genereertAgendapunt /
    besluitvorming:geagendeerdStuk  ?agendaitemDocuments .

    FILTER NOT EXISTS { ?case dossier:Dossier.bestaatUit ?agendaitemDocuments . }
}
  `

  try {
    await update(deleteUnrelatedDocumentsQuery);
    await update(insertSubcaseDocumentsQuery);
    await update(insertAgendaitemDocumentsQuery);
  } catch (error) {
    throw new Error(`Failed to execute some steps during syncing of the case documents. Reason: ${error.message}`);
  }
}

module.exports = {
  syncDocsForSubjectInGraph,
  syncDocsForCase
};
