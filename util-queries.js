import { querySudo, updateSudo } from '@lblod/mu-auth-sudo';
import { sparqlEscape, sparqlEscapeUri } from 'mu';
import groupBy from 'lodash.groupby';

import { parseSparqlResults } from './lib/query-util';

async function subjectIsTypeInGraph (subject, graph, types) {
  const queryString = `
SELECT DISTINCT ?type
WHERE {
    GRAPH ${sparqlEscapeUri(graph)} {
        ${sparqlEscapeUri(subject)} a ?type .
        VALUES ?type {
            ${types.map(sparqlEscapeUri).join('\n                ')}
        }
    }
}
  `;
  const result = await querySudo(queryString);
  const parsedResults = parseSparqlResults(result);
  return parsedResults.length ? parsedResults[0].type : null;
}

function graphStatementsFromQuads (quads, graph) {
  const quadsByGraph = groupBy(quads, q => q.graph.value);
  let graphStatements = '';
  for (const [graph, triples] of Object.entries(quadsByGraph)) {
    graphStatements += `
    GRAPH ${sparqlEscapeUri(graph)} {
        ${triples.map(t => sparqlEscape(t.subject.value, t.subject.type) + ' ' +
            sparqlEscape(t.predicate.value, t.predicate.type) + ' ' +
            sparqlEscape(t.object.value, t.object.type) + ' .').join('\n        ')}
    }
`;
  }
  return graphStatements;
}

async function deleteQuads (quads) {
  const graphStatements = graphStatementsFromQuads(quads);
  if (graphStatements) {
    const queryString = `
DELETE DATA {
    ${graphStatements}
}`;
    const result = await updateSudo(queryString);
    return result;
  } else {
    return null;
  }
}

async function insertQuads (quads) {
  const graphStatements = graphStatementsFromQuads(quads);
  if (graphStatements) {
    const queryString = `
INSERT DATA {
    ${graphStatements}
}`;
    const result = await updateSudo(queryString);
    return result;
  } else {
    return null;
  }
}

module.exports = {
  subjectIsTypeInGraph,
  deleteQuads,
  insertQuads
};
