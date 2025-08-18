PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_streak_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`streak` integer
);
--> statement-breakpoint
INSERT INTO `__new_streak_table`("id", "streak") SELECT "id", "streak" FROM `streak_table`;--> statement-breakpoint
DROP TABLE `streak_table`;--> statement-breakpoint
ALTER TABLE `__new_streak_table` RENAME TO `streak_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `day_table` ADD `isFrozen` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `day_table` ADD `isStreak` integer DEFAULT 0;