import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { uuidv7 } from "uuidv7"

export const uploads = pgTable("uploads", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    remoteKey: text("remote_key").notNull().unique(),
    remoteUrl: text("remote_url").notNull(),
    // We can send as second parameter of timestamp the 'withTimezone' option to avoid the timezone issues
    createdAt: timestamp("created_at").notNull().defaultNow(),
})