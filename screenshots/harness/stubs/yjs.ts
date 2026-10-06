/**
 * Stand-in for `yjs`, aliased in build.mjs only so @nimbalyst/extension-sdk's
 * collab module resolves outside the real app. Mr. Themes has no collab
 * content adapter and never constructs a Y.Doc; this harness never calls
 * anything exported here.
 */
export class Doc {}
export class Map {}
export class Array {}
export class Text {}
export class XmlElement {}
export class XmlFragment {}
export class UndoManager {}
