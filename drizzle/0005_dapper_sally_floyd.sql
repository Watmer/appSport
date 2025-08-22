CREATE TABLE `aiChatSession_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`systemRole` text NOT NULL,
	`systemMessage` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `aiMessages_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role` text NOT NULL,
	`message` text NOT NULL,
	`aiChatId` integer,
	FOREIGN KEY (`aiChatId`) REFERENCES `aiChatSession_table`(`id`) ON UPDATE no action ON DELETE no action
);
