import { Static, Type } from '@fastify/type-provider-typebox';

export const DocumentSchema = Type.Object({
  id: Type.Optional(Type.String()),
  content: Type.String({ minLength: 1 }),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

export const DocumentUpdateSchema = Type.Object({
  content: Type.Optional(Type.String({ minLength: 1 })),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

export const DocumentSearchSchema = Type.Object({
  query: Type.String({ minLength: 1 }),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 5 })),
  filter: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

export const DocumentResponseSchema = Type.Object({
  id: Type.String(),
  content: Type.String(),
  metadata: Type.Record(Type.String(), Type.Any()),
  created: Type.Optional(Type.String()),
  updated: Type.Optional(Type.String()),
});

export const DocumentSearchResponseSchema = Type.Object({
  results: Type.Array(
    Type.Object({
      document: DocumentResponseSchema,
      score: Type.Number({ minimum: 0, maximum: 1 }),
    })
  ),
  query: Type.String(),
  total: Type.Number(),
});

export const DocumentListResponseSchema = Type.Object({
  documents: Type.Array(DocumentResponseSchema),
  total: Type.Number(),
  limit: Type.Number(),
  offset: Type.Number(),
});

export const CollectionStatsSchema = Type.Object({
  name: Type.String(),
  count: Type.Number(),
  metadata: Type.Record(Type.String(), Type.Any()),
});

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    message: Type.String(),
    code: Type.String(),
    details: Type.Optional(Type.Any()),
  }),
});

export type Document = Static<typeof DocumentSchema>;
export type DocumentUpdate = Static<typeof DocumentUpdateSchema>;
export type DocumentSearch = Static<typeof DocumentSearchSchema>;
export type DocumentResponse = Static<typeof DocumentResponseSchema>;
export type DocumentSearchResponse = Static<typeof DocumentSearchResponseSchema>;
export type DocumentListResponse = Static<typeof DocumentListResponseSchema>;
export type CollectionStats = Static<typeof CollectionStatsSchema>;
export type ErrorResponse = Static<typeof ErrorResponseSchema>;