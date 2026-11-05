import { app, errorHandler } from 'mu';
import bodyParser from 'body-parser';
import cron from 'node-cron';

import * as deltaUtil from './lib/delta-util';
import { subjectIsTypeInGraph } from './util-queries';
import { syncDocsForSubjectInGraph, syncAllCaseDocs } from './case-doc-queries';
import { ALLOWED_DELTA_SIZE, GRAPH, UPDATEABLE_PREDICATES, WATCH_TYPES } from './config';

const CRON_PATTERN = process.env.CRON_PATTERN || '0 0 * * *';

cron.schedule(CRON_PATTERN, async () => {
  try {
    console.log(`[cron] Running case-documents sync (pattern: ${CRON_PATTERN})...`);
    await syncAllCaseDocs();
    console.log('[cron] Case-documents sync completed.');
  } catch (err) {
    console.trace(err);
  }
});

app.post('/run', async (req, res, next) => {
  try {
    console.log('Running case-documents sync...');
    await syncAllCaseDocs();
    console.log('Case-documents sync completed.');
    return res.status(200).send({ message: 'Case-documents sync completed.' });
  } catch (err) {
    console.trace(err);
    const error = new Error(err.message || 'Something went wrong while running case-documents sync.');
    error.status = 500;
    return next(error);
  }
});

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

app.use(errorHandler);
