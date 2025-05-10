import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { randomUUID } from "node:crypto"

export const uploads = pgTable("uploads", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    remoteKey: text("remote_key").notNull().unique(),
    remoteUrl: text("remote_url").notNull(),
    // We can send as second parameter of timestamp the 'withTimezone' option to avoid the timezone issues
    createdAt: timestamp("created_at").notNull().defaultNow(),
})