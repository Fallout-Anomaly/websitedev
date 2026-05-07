import { pgTable, text, boolean, timestamp, uuid, uniqueIndex, index } from "drizzle-orm/pg-core";

export const wikiPages = pgTable(
  "wiki_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    path: text("path").notNull(), // e.g. "getting-started/installation"
    title: text("title").notNull(),
    contentMd: text("content_md").notNull().default(""),
    /**
     * Public visibility flag. Only staff can set this true.
     * Non-staff can request publication via `publishRequestedAt`.
     */
    published: boolean("published").notNull().default(false),
    publishRequestedAt: timestamp("publish_requested_at", { withTimezone: true }),
    publishRequestedBy: uuid("publish_requested_by"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: uuid("published_by"),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pathUnique: uniqueIndex("wiki_pages_path_unique").on(t.path),
    publishedIdx: index("wiki_pages_published_idx").on(t.published),
  }),
);

