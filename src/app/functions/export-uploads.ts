import { db, pg } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeRight } from '@/infra/shared/either'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { stringify } from 'csv-stringify'
import { ilike } from 'drizzle-orm'
import { PassThrough, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { z } from 'zod'

const exportUploadsInput = z.object({
  searchQuery: z.string().optional(),
})

type ExportUploadsInput = z.input<typeof exportUploadsInput>

type ExportUploadsOutput = {
  reportUrl: string
}

export async function exportUploads(
  input: ExportUploadsInput
): Promise<Either<never, ExportUploadsOutput>> {
  const { searchQuery } = await exportUploadsInput.parse(input)

  const { sql, params } = db
    .select({
      id: schema.uploads.id,
      name: schema.uploads.name,
      remoteUrl: schema.uploads.remoteUrl,
      createdAt: schema.uploads.createdAt,
    })
    .from(schema.uploads)
    .where(searchQuery ? ilike(schema.uploads.name, `%${searchQuery}%`) : undefined)
    .toSQL()

  // Allow SQL Injection, we need to use the native driver (pg) because drizzle ORM doesn't have the cursor support
  const cursor = pg.unsafe(sql, params as string[]).cursor(2)

  const csv = stringify({
    delimiter: ',', // Colunas separadas por virgulas
    header: true, // se a primeira linha vai ter o nome das colunas
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'remote_url', header: 'URL' },
      { key: 'created_at', header: 'Uploaded at' },
    ],
  })

  // Repassa os valores inseridos de uma stream para o output
  const uploadToStorageStream = new PassThrough()

  // input (READABLE) -> data transform -> output (WRITABLE)
  const convertToCSVPipeline = await pipeline(
    cursor, // The data will come from the cursor
    new Transform({
      objectMode: true, // Converto to primitive types like array, object. É como se fizesse um strinfify no buffer
      transform(chunks: unknown[], enconding, callback) {
        for (const chunk of chunks) {
          this.push(chunk) // escrevendo no output da stream cada linha que vem do banco de dados (com o cursor vem 2) uma por vez
        }

        callback()
      },
    }),
    csv,
    // stream de escrita no Cloudflare R2
    uploadToStorageStream
  )

  const uploadToStorage = uploadFileToStorage({
    contentType: 'text/csv',
    folder: 'downloads',
    fileName: `${new Date().toISOString()}-uploads.csv`,
    contentStream: uploadToStorageStream,
  })

  const [{ url }] = await Promise.all([uploadToStorage, convertToCSVPipeline])

  return makeRight({ reportUrl: url })
}
