alter table POST_COMMENT add(DELETION_DATE DATETIME default null);
create index DELETION_DATE_INDEX ON POST_COMMENT (DELETION_DATE)