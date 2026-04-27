// Wires fake-indexeddb into the global scope so `idb` (and therefore the
// app's repo layer) can run unchanged in tests. Each test file should call
// `indexedDB.deleteDatabase(...)` in beforeEach if it wants a clean slate.
import "fake-indexeddb/auto";
