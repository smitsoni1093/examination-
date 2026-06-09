SET NOCOUNT ON;

;WITH RankedQuestions AS (
    SELECT
        q.Id,
        ROW_NUMBER() OVER (
            PARTITION BY CASE
                WHEN NULLIF(LTRIM(RTRIM(ISNULL(q.SourceFileName, ''))), '') IS NULL THEN '__MANUAL__'
                ELSE q.SourceFileName
            END
            ORDER BY q.CreatedAt, q.Id
        ) AS NewDisplayOrder
    FROM Questions q
    WHERE ISNULL(q.DisplayOrder, 0) = 0
)
UPDATE q
SET DisplayOrder = r.NewDisplayOrder
FROM Questions q
INNER JOIN RankedQuestions r ON r.Id = q.Id;
