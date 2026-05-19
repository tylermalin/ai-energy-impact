CREATE TABLE `contributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`organization` text,
	`contributionType` text NOT NULL,
	`message` text NOT NULL,
	`dataUrl` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`adminNotes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ingestion_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`adapter` text NOT NULL,
	`startedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`finishedAt` integer,
	`status` text DEFAULT 'running' NOT NULL,
	`summary` text,
	`errors` text,
	`consecutiveFailures` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ir_adapter` ON `ingestion_runs` (`adapter`);--> statement-breakpoint
CREATE INDEX `idx_ir_startedAt` ON `ingestion_runs` (`startedAt`);--> statement-breakpoint
CREATE TABLE `model_energy_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`modelName` text NOT NULL,
	`modelFamily` text NOT NULL,
	`modelVersion` text,
	`vendor` text NOT NULL,
	`parameters` text,
	`openWeight` integer DEFAULT false NOT NULL,
	`category` text NOT NULL,
	`taskClass` text NOT NULL,
	`energyUnit` text NOT NULL,
	`energyWh` real,
	`energyWhMin` real,
	`energyWhMax` real,
	`carbonGCO2e` real,
	`waterMl` real,
	`tauApplied` real,
	`fApplied` real,
	`pueApplied` real,
	`gridIntensityGCO2ePerKWh` real,
	`wueLPerKWh` real,
	`facilityClass` text,
	`hardwareClass` text,
	`methodologyVersion` text,
	`energyWhP10` real,
	`energyWhP90` real,
	`carbonGCO2eP10` real,
	`carbonGCO2eP90` real,
	`waterMlP10` real,
	`waterMlP90` real,
	`classification` text NOT NULL,
	`confidence` text NOT NULL,
	`sourceName` text NOT NULL,
	`sourceUrl` text NOT NULL,
	`sourceCitation` text,
	`measurementDate` integer NOT NULL,
	`ingestedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastVerifiedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`hardware` text,
	`softwareVersion` text,
	`contextLength` integer,
	`batchSize` integer,
	`promptClass` text,
	`trainingOrInference` text DEFAULT 'inference' NOT NULL,
	`standardizedConditions` text,
	`compositeRank` integer,
	`inTop20` integer DEFAULT false NOT NULL,
	`scaffold` text,
	`sweVerified` real,
	`swePro` real,
	`status` text DEFAULT 'active' NOT NULL,
	`statusNote` text,
	`utilityScore` text,
	`notes` text,
	`sourceFingerprint` text NOT NULL,
	`promotedAt` integer,
	`sanityDocId` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_mer_modelName` ON `model_energy_records` (`modelName`);--> statement-breakpoint
CREATE INDEX `idx_mer_category` ON `model_energy_records` (`category`);--> statement-breakpoint
CREATE INDEX `idx_mer_classification` ON `model_energy_records` (`classification`);--> statement-breakpoint
CREATE INDEX `idx_mer_lastVerifiedAt` ON `model_energy_records` (`lastVerifiedAt`);--> statement-breakpoint
CREATE INDEX `idx_mer_inTop20` ON `model_energy_records` (`inTop20`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_mer_sourceFingerprint` ON `model_energy_records` (`sourceFingerprint`);--> statement-breakpoint
CREATE TABLE `pending_updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sourceFingerprint` text NOT NULL,
	`targetRecordId` integer,
	`adapter` text NOT NULL,
	`proposed` text NOT NULL,
	`current` text,
	`diffSummary` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewedBy` text,
	`reviewedAt` integer,
	`reviewNotes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pu_status` ON `pending_updates` (`status`);--> statement-breakpoint
CREATE INDEX `idx_pu_adapter` ON `pending_updates` (`adapter`);--> statement-breakpoint
CREATE TABLE `ranking_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`category` text NOT NULL,
	`pulledAt` integer DEFAULT (unixepoch()) NOT NULL,
	`rawPayloadHash` text NOT NULL,
	`appliedChanges` text,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rr_source_category` ON `ranking_runs` (`source`,`category`);--> statement-breakpoint
CREATE INDEX `idx_rr_pulledAt` ON `ranking_runs` (`pulledAt`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);