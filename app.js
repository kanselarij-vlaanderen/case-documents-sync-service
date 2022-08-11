import { app, errorHandler } from 'mu';
import bodyParser from 'body-parser';

import * as deltaUtil from './lib/delta-util';
import { subjectIsTypeInGraph } from './util-queries';
import { syncObjectsForSubjectInGraph, unsyncObjectsForSubjectInGraph } from './case-doc-queries';
import { GRAPH, UPDATEABLE_PREDICATES, WATCH_TYPES, CASE_FIELD_PREDICATE } from './config';

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
    const watchedType = WATCH_TYPES.find(t => t.predicateToObject.uri === d.predicate.value);
    const subjectType = watchedType.type;
    const casePredicate = watchedType.casePredicate;
    if (await subjectIsTypeInGraph(subjectUri, GRAPH, [subjectType])) {
      await syncObjectsForSubjectInGraph(d.subject.value, subjectType, GRAPH);
      /* 
        TODO KAS-3484 the reason for this block is to cleanup field relations found on case but not on the subjects.
        This is really only useful for publications since they see the list but can't edit.
        Mistakes (wrong added and removed) made by users will just keep existing unless we remove them here.
        Only used for type fields. not safe to do for docs because of multiple subjects and legacy data.
      */
      if (casePredicate === CASE_FIELD_PREDICATE) {
        await unsyncObjectsForSubjectInGraph(d.subject.value, subjectType, GRAPH);
      }
    }
  }
});

app.use(errorHandler);
