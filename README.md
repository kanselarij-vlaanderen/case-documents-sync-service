# Case documents sync service
The documents-part of the [OSLO "besluitvorming"-model](https://test.data.vlaanderen.be/doc/applicatieprofiel/besluitvorming) is centered around a case (`dossier:Dossier`) that contains many documents (`dossier:Stuk`). By means of specific relationships, other entities such as subcase (`dossier:Procedurestap`) and agenda-item (`besluit:Agendapunt`) then can relate to a subset of these documents, thus representing that they use or produce these specific documents within the case.  
In practice however, it is currently desired that new documents can be added directly to a related entity, instead of first adding them to a case and linking to them afterward. Nonetheless, we want to keep the case's full set of documents up to date for accordance to the OSLO-model, since this data will be used by other parties in the near future.  
Keeping the case's documents "in sync" each time the documents in a related entity gets updated, is difficult to fully cover in the fronted. This service listens to changes in the relationships to documents through [delta's](https://github.com/mu-semtech/delta-notifier) and updates the case's documents accordingly.

## Configuration
All configuration is hard-coded in `config.js`.

Use following snippet in delta-notifier config:
```js
{
  match: {
    predicate: {
      type: "uri",
      value: "http://mu.semte.ch/vocabularies/ext/bevatAgendapuntDocumentversie"
    }
  },
  callback: {
    url: 'http://case-documents-sync/delta',
    method: 'POST'
  },
  options: {
    resourceFormat: 'v0.0.1',
    gracePeriod: 5000,
    ignoreFromSelf: true
  }
}
{
  match: {
    predicate: {
      type: "uri",
      value: "http://mu.semte.ch/vocabularies/ext/bevatDocumentversie"
    }
  },
  callback: {
    url: 'http://case-documents-sync/delta',
    method: 'POST'
  },
  options: {
    resourceFormat: 'v0.0.1',
    gracePeriod: 5000,
    ignoreFromSelf: true
  }
}
```

## Available endpoints

#### POST /delta

Internal endpoint for receiving deltas from the [delta-notifier](https://github.com/mu-semtech/delta-notifier)
