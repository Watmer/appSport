CREATE TABLE `savedRecepy_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mealId` integer,
	FOREIGN KEY (`mealId`) REFERENCES `meal_table`(`id`) ON UPDATE no action ON DELETE no action
);
