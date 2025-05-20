import { uploadImage } from '@/app/functions/upload-image'
import { isRight, unwrapEither } from '@/infra/shared/either'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const uploadImageRoute: FastifyPluginAsyncZod = async server => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an image',
        consumes: ['multipart/form-data'], // para receber arquivos
        tags: ['uploads'],
        response: {
          201: z.null().describe('Image uploaded.'),
          400: z.object({ message: z.string() }).describe('Upload already exists.'),
        },
      },
    },
    async (request, reply) => {
      const uploadedFile = await request.file({
        limits: { fileSize: 1024 * 1024 * 2 }, //2mb (1024 = 1kb)
      })

      if (!uploadedFile) {
        return reply.status(400).send({ message: 'File is required.' })
      }

      // we should avoid this because it is not scalable
      // with multiple users, the variable file will receive too much content and it will cost a lot
      // const file = await uploadedFile?.toBuffer();

      const result = await uploadImage({
        fileName: uploadedFile.filename,
        contentType: uploadedFile.mimetype,
        // We should use streams to send data to the storage service
        // asynchronously while the front-end also sends data to the backend
        contentStream: uploadedFile.file,
      })

      // After the functions that consumes the stream
      // Check if the file is truncated (Boolean)
      if (uploadedFile.file.truncated) {
        return reply.status(400).send({
          message: 'File size limit reached.',
        })
      }

      //unwrapEither returns the result
      if (isRight(result)) {
        return reply.status(201).send()
      }

      const error = unwrapEither(result)

      switch (error.constructor.name) {
        case 'InvalidFileFormat':
          return reply.status(400).send({ message: error.message })
      }
    }
  )
}
