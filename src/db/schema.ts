import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  integer,
  real,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 512 }).notNull(),
  originalFileUrl: text("original_file_url"),
  processedFileUrl: text("processed_file_url"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // pending | uploading | analyzing | processing | completed | failed
  outputFormat: varchar("output_format", { length: 10 }).notNull().default("mp3"),
  // Analysis results
  analysisData: jsonb("analysis_data"),
  // Processing settings
  processingSettings: jsonb("processing_settings"),
  // Metadata
  durationSeconds: real("duration_seconds"),
  originalBitrate: integer("original_bitrate"),
  sampleRate: integer("sample_rate"),
  channels: integer("channels"),
  errorMessage: text("error_message"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
