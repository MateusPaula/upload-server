import { db } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
// Generate fictional data
import { fakerPT_BR as faker } from '@faker-js/faker';
import { InferInsertModel } from "drizzle-orm";

export async function makeUpload(
    // InferInsertModel tells us what fields the table accepts as insert
    overrides?: Partial<InferInsertModel<typeof schema.uploads>>
) {
    const fileName = faker.system.fileName()
    
    const result = await db.insert(schema.uploads).values({
        name: fileName,
        remoteKey: `images/${fileName}`,
        remoteUrl: `http://example.com/images/${fileName}`,
        ...overrides
    }).returning()

    return result[0]
}