ALTER TABLE IdeaSheets
ADD foreign key (id) references Users (id);
ALTER TABLE IdeaNodes
ADD foreign key (rootID) references IdeaSheets (rootID);
ALTER TABLE IdeaBranches
ADD foreign key (elementID) references IdeaNodes (elementID);
SELECT *
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
where table_schema = 'Mindmap';