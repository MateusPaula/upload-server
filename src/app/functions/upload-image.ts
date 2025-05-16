import { db } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { uploadFiletoStorage } from "@/infra/storage/upload-file-to-storage";
import { Either, makeLeft, makeRight } from "@/shared/either";
import { Readable } from "node:stream";
import { z } from "zod";
import { InvalidFileFormat } from "./errors/invalid-file-format";

const uploadImageSchema = z.object({
    fileName: z.string(),
    contentType: z.string(),
    contentStream: z.instanceof(Readable)
})

// z.input = consider input values when transforming the type
// z.infer / output = consider output values when transforming the type
type UploadImageInput = z.input<typeof uploadImageSchema> 

const allowedMimeTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']

export async function uploadImage(input: UploadImageInput): Promise<Either<InvalidFileFormat, { url: string }>> {
   const { fileName, contentType, contentStream } = uploadImageSchema.parse(input)

   if (!allowedMimeTypes.includes(contentType)){
    return makeLeft(new InvalidFileFormat())
   }

   const {key, url } = await uploadFiletoStorage({
    folder: 'images',
    fileName,
    contentType,
    contentStream
   })

   await db.insert(schema.uploads).values({
    name: fileName,
    remoteKey: key,
    remoteUrl: url
   })

   return makeRight({ url: '' })
    
}