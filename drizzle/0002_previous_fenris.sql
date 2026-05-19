CREATE TABLE `ingestion_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adapter` varchar(64) NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	`status` enum('running','succeeded','failed','partial') NOT NULL DEFAULT 'running',
	`summary` json,
	`errors` text,
	`consecutiveFailures` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingestion_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_energy_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelName` varchar(255) NOT NULL,
	`modelFamily` varchar(128) NOT NULL,
	`modelVersion` varchar(128),
	`vendor` varchar(128) NOT NULL,
	`parameters` varchar(64),
	`openWeight` boolean NOT NULL DEFAULT false,
	`category` enum('text','image','video','code','audio','other') NOT NULL,
	`taskClass` enum('text_generation','reasoning','image_diffusion','video_generation','audio_asr','classification','detection','translation','agentic_workflow','code_swe_task') NOT NULL,
	`energyUnit` enum('wh_per_inference','wh_per_image','wh_per_video_second','wh_per_coding_task') NOT NULL,
	`energyWh` double,
	`energyWhMin` double,
	`energyWhMax` double,
	`carbonGCO2e` double,
	`waterMl` double,
	`classification` enum('measured','derived','estimated') NOT NULL,
	`confidence` enum('high','medium','medium-low','low') NOT NULL,
	`sourceName` varchar(255) NOT NULL,
	`sourceUrl` text NOT NULL,
	`sourceCitation` text,
	`measurementDate` timestamp NOT NULL,
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	`lastVerifiedAt` timestamp NOT NULL DEFAULT (now()),
	`hardware` varchar(128),
	`softwareVersion` varchar(128),
	`contextLength` int,
	`batchSize` int,
	`promptClass` enum('single_turn_chat','long_context','tool_use','rag','multi_turn'),
	`trainingOrInference` enum('inference','training','both') NOT NULL DEFAULT 'inference',
	`standardizedConditions` json,
	`compositeRank` int,
	`inTop20` boolean NOT NULL DEFAULT false,
	`scaffold` varchar(128),
	`sweVerified` double,
	`swePro` double,
	`status` enum('active','sunsetting','deprecated') NOT NULL DEFAULT 'active',
	`statusNote` varchar(255),
	`utilityScore` varchar(255),
	`notes` text,
	`sourceFingerprint` varchar(128) NOT NULL,
	`promotedAt` timestamp,
	`sanityDocId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `model_energy_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_mer_sourceFingerprint` UNIQUE(`sourceFingerprint`)
);
--> statement-breakpoint
CREATE TABLE `pending_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceFingerprint` varchar(128) NOT NULL,
	`targetRecordId` int,
	`adapter` varchar(64) NOT NULL,
	`proposed` json NOT NULL,
	`current` json,
	`diffSummary` text,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` varchar(320),
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pending_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ranking_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(64) NOT NULL,
	`category` enum('text','image','video','code','audio','other') NOT NULL,
	`pulledAt` timestamp NOT NULL DEFAULT (now()),
	`rawPayloadHash` varchar(128) NOT NULL,
	`appliedChanges` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ranking_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_ir_adapter` ON `ingestion_runs` (`adapter`);--> statement-breakpoint
CREATE INDEX `idx_ir_startedAt` ON `ingestion_runs` (`startedAt`);--> statement-breakpoint
CREATE INDEX `idx_mer_modelName` ON `model_energy_records` (`modelName`);--> statement-breakpoint
CREATE INDEX `idx_mer_category` ON `model_energy_records` (`category`);--> statement-breakpoint
CREATE INDEX `idx_mer_classification` ON `model_energy_records` (`classification`);--> statement-breakpoint
CREATE INDEX `idx_mer_lastVerifiedAt` ON `model_energy_records` (`lastVerifiedAt`);--> statement-breakpoint
CREATE INDEX `idx_mer_inTop20` ON `model_energy_records` (`inTop20`);--> statement-breakpoint
CREATE INDEX `idx_pu_status` ON `pending_updates` (`status`);--> statement-breakpoint
CREATE INDEX `idx_pu_adapter` ON `pending_updates` (`adapter`);--> statement-breakpoint
CREATE INDEX `idx_rr_source_category` ON `ranking_runs` (`source`,`category`);--> statement-breakpoint
CREATE INDEX `idx_rr_pulledAt` ON `ranking_runs` (`pulledAt`);