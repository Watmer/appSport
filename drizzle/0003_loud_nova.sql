CREATE TABLE `streak_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`streak` integer,
	`frozenDaysId` text,
	`failedDaysId` text,
	`streakDaysId` text,
	FOREIGN KEY (`frozenDaysId`) REFERENCES `day_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`failedDaysId`) REFERENCES `day_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`streakDaysId`) REFERENCES `day_table`(`id`) ON UPDATE no action ON DELETE no action
);
