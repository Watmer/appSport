CREATE TABLE `day_table` (
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ingredients_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mealId` integer,
	`ingName` text,
	`quantity` text,
	FOREIGN KEY (`mealId`) REFERENCES `meal_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meal_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dayId` text,
	`meal` text,
	`foodName` text,
	`time` integer,
	`completed` integer,
	`recepy` text,
	`comments` text,
	FOREIGN KEY (`dayId`) REFERENCES `day_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shopItem_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shopListId` integer,
	`itemName` text,
	`completed` integer,
	FOREIGN KEY (`shopListId`) REFERENCES `shopList_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shopList_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL
);
