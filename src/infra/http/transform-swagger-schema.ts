import { jsonSchemaTransform } from 'fastify-type-provider-zod'

type TransformSwaggerSchemaData = Parameters<typeof jsonSchemaTransform>[0] // primeiro parametro

export function transformSwaggerSchema(data: TransformSwaggerSchemaData) {
  const { schema, url } = jsonSchemaTransform(data)

  if (schema.consumes?.includes('multipart/form-data')) {
    if (schema.body === undefined) {
      schema.body = {
        type: 'object',
        required: [],
        properties: {},
      }
    }

    schema.body.properties.file = {
      type: 'string',
      format: 'binary', //formato openai pra dizer que é um arquivo
    }

    schema.body.required.push('file')
  }
  return { schema, url }
}
