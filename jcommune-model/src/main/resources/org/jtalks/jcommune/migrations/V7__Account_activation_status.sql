ALTER TABLE `JC_USER_DETAILS` ADD `ENABLED` bool DEFAULT FALSE;
UPDATE `JC_USER_DETAILS` UD  SET `ENABLED` = TRUE;