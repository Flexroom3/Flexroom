
-- 2. Switch to the new Database
USE FlexroomDB;
GO

-- 3. Create the 'Settings' table we mentioned in index.js
CREATE TABLE Settings (
    ID INT PRIMARY KEY IDENTITY(1,1),
    welcomeMessage NVARCHAR(255) NOT NULL,
    systemVersion NVARCHAR(50),
    lastUpdated DATETIME DEFAULT GETDATE()
);
GO

-- 4. Insert the row that Node.js is looking for
INSERT INTO Settings (welcomeMessage, systemVersion)
VALUES ('Hello from the Flexroom SQL Database!', 'v1.0.0');
GO

-- 5. Verify the data is there
SELECT * FROM Settings;