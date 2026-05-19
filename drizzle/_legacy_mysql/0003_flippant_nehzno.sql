ALTER TABLE `model_energy_records` ADD `tauApplied` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `fApplied` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `pueApplied` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `gridIntensityGCO2ePerKWh` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `wueLPerKWh` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `facilityClass` enum('hyperscale_modern','hyperscale_standard','enterprise','legacy','unknown');--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `hardwareClass` varchar(64);--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `methodologyVersion` varchar(64);--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `energyWhP10` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `energyWhP90` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `carbonGCO2eP10` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `carbonGCO2eP90` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `waterMlP10` double;--> statement-breakpoint
ALTER TABLE `model_energy_records` ADD `waterMlP90` double;