import { app, errorHandler } from 'mu';
import bodyParser from 'body-parser';

import * as deltaUtil from './lib/delta-util';
import { subjectIsTypeInGraph } from './util-queries';
import { syncDocsForSubjectInGraph } from './case-doc-queries';
import { GRAPH, UPDATEABLE_PREDICATES, WATCH_TYPES } from './config';

app.post('/delta', bodyParser.json(), async (req, res) => {
  res.status(202).end();
  const insertionDeltas = deltaUtil.insertionDeltas(req.body);
  const deletionDeltas = deltaUtil.deletionDeltas(req.body);
  if (insertionDeltas.length || deletionDeltas.length) {
    console.debug(`Received deltas (${insertionDeltas.length + deletionDeltas.length} total)`);
  } else {
    return; // Empty delta message received on startup?
  }

  // UPDATES in group path (entities need graph-moving)
  const pathUpdates = deltaUtil.filterByPredicate(insertionDeltas, UPDATEABLE_PREDICATES);
  if (pathUpdates.length) {
    console.log(`Received deltas for ${pathUpdates.length} document-relations that need updates in their case as well.`);
  }
  for (const d of pathUpdates) {
    const subjectUri = d.subject.value;
    const subjectType = WATCH_TYPES.find(t => t.predicateToDoc.uri === d.predicate.value).type;
    if (await subjectIsTypeInGraph(subjectUri, GRAPH, [subjectType])) {
      await syncDocsForSubjectInGraph(d.subject.value, subjectType, GRAPH);
    }
  }
});

app.use(errorHandler);
