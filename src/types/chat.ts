import { Static, Type } from '@fastify/type-provider-typebox';

export const ChatRequestSchema = Type.Object({
  messages: Type.Array(
    Type.Object({
      role: Type.Union([Type.Literal('user'), Type.Literal('assistant'), Type.Literal('system')]),
      content: Type.String({ minLength: 1 }),
    }),
    { minItems: 1 }
  ),
  model: Type.Optional(Type.String({ default: 'deepseek-chat' })),
  temperature: Type.Optional(Type.Number({ minimum: 0, maximum: 2, default: 0.7 })),
  maxTokens: Type.Optional(Type.Number({ minimum: 1, maximum: 4000, default: 1000 })),
  stream: Type.Optional(Type.Boolean({ default: false })),
});

export const ChatResponseSchema = Type.Object({
  id: Type.String(),
  object: Type.String(),
  created: Type.Number(),
  model: Type.String(),
  choices: Type.Array(
    Type.Object({
      index: Type.Number(),
      message: Type.Object({
        role: Type.String(),
        content: Type.String(),
      }),
      finishReason: Type.Optional(Type.String()),
    })
  ),
  usage: Type.Optional(
    Type.Object({
      promptTokens: Type.Number(),
      completionTokens: Type.Number(),
      totalTokens: Type.Number(),
    })
  ),
});

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    message: Type.String(),
    code: Type.String(),
    details: Type.Optional(Type.Any()),
  }),
});

export type ChatRequest = Static<typeof ChatRequestSchema>;
export type ChatResponse = Static<typeof ChatResponseSchema>;
export type ErrorResponse = Static<typeof ErrorResponseSchema>;