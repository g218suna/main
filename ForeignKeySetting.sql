ALTER TABLE IdeaSheets
ADD foreign key (id) references Users (id);
ALTER TABLE IdeaSheets
ADD foreign key (id) references Users (id);
ALTER TABLE IdeaSheets
ADD foreign key (id) references Users (id);
SELECT *
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
where table_schema = 'Mindmap';