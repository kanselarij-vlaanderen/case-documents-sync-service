import { app, errorHandler } from 'mu';
import bodyParser from 'body-parser';

import * as deltaUtil from './lib/delta-util';
import { subjectIsTypeInGraph } from './util-queries';
import { syncDocsForSubjectInGraph, syncDocsForCase } from './case-doc-queries';
import { ALLOWED_DELTA_SIZE, GRAPH, UPDATEABLE_PREDICATES, WATCH_TYPES } from './config';

app.post('/delta', bodyParser.json({ limit: ALLOWED_DELTA_SIZE }), async (req, res) => {
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

/**
 * The automatic delta processing should cover most of the syncing if case documents
 * this route can be called manually for actions where the sync doesn't work
 * Like moving subcases between cases.
 * We need to remove documents from the old case and add to the new case
 */
app.post('/cases/:id/sync', async (req, res, next) => {
  try {
    const caseId = req.params.id;
    if (!caseId) {
      return next({ message: 'Path parameter case ID was not set, cannot proceed', status: 400 });
    }
    await syncDocsForCase(caseId);
    return res.status(201).send();
  } catch(e) {
    console.log('could not sync case documents');
    console.trace(e);
    return next({ message: e.message, status: 500 });
  }
});

app.use(errorHandler);
