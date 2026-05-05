-- Run against FlexroomDB to align with grading routes and enrollment.
-- Safe to re-run if objects already exist (check messages).

USE FlexroomDB;
GO

IF OBJECT_ID('dbo.ClassEnrollment', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClassEnrollment (
        userID INT NOT NULL,
        classID INT NOT NULL,
        CONSTRAINT PK_ClassEnrollment PRIMARY KEY (userID, classID),
        CONSTRAINT FK_ClassEnrollment_User FOREIGN KEY (userID) REFERENCES dbo.Users (UserID),
        CONSTRAINT FK_ClassEnrollment_Class FOREIGN KEY (classID) REFERENCES dbo.CourseClass (classID)
    );
END
GO

IF COL_LENGTH('dbo.Assessment', 'questionFile') IS NULL
    ALTER TABLE dbo.Assessment ADD questionFile VARBINARY(MAX) NULL;
IF COL_LENGTH('dbo.Assessment', 'solutionFile') IS NULL
    ALTER TABLE dbo.Assessment ADD solutionFile VARBINARY(MAX) NULL;
GO

-- Optional: set a bcrypt-hashed password for local login tests (password: LogicPass123)
-- UPDATE dbo.Users
-- SET Password = N'$2b$10$lT9z1.7n2HpLy32uSJKs6.jMmGaAWrQQlORbyR2d6GR8LPsNjcfEG'
-- WHERE Email = N'mibrahim@gmail.com';
-- GO
