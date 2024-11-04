CREATE TABLE budget (
	user_id INT UNSIGNED NOT NULL,
    bud_seq INT UNSIGNED NOT NULL,
    bud_amt DECIMAL(10, 2) NOT NULL,
    bud_desc TEXT,
    bud_start_date DATE NOT NULL,
    bud_end_date DATE NOT NULL,
    bud_active BOOL DEFAULT(0),
    PRIMARY KEY (user_id, bud_seq),
    FOREIGN KEY (user_id)
		REFERENCES user (user_id)
        ON DELETE CASCADE,
	CONSTRAINT bud_date_check
		CHECK (bud_start_date <= bud_end_date)
);

-- budget date constraint: start date must always be less than or equal to the end date

/* 
budget trigger constraint: before a new budget is inserted, make sure the new budget's dates do not overlap
with any dates related to the user.
for example:
	if an entry has a start date of 2022-10-02 and end date of 2022-10-04,
	the trigger must not allow any insertion of:
		1. 2022-10-03 (start) and 2022-10-04 (end)
        2. 2022-10-01 (start) and 2022-10-03 (end)
        3. 2022-10-03 (start) and 2022-10-05 (end)
        4. 2022-10-01 (start) and 2022-10-05 (end)
        5. etc.
*/


DELIMITER //
CREATE TRIGGER before_insert_budget
BEFORE INSERT ON budget
FOR EACH ROW
BEGIN
    DECLARE date_conflict INT;

    -- check for any overlapping date ranges for the same user
    SELECT COUNT(*)
    INTO date_conflict
    FROM budget
    WHERE user_id = NEW.user_id
      AND (
          (NEW.bud_start_date BETWEEN bud_start_date AND bud_end_date)
          OR (NEW.bud_end_date BETWEEN bud_start_date AND bud_end_date)
          OR (bud_start_date BETWEEN NEW.bud_start_date AND NEW.bud_end_date)
          OR (bud_end_date BETWEEN NEW.bud_start_date AND NEW.bud_end_date)
      );

    -- if there is a conflict, signal an error
    IF date_conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'date range conflict: the new budget overlaps with an existing budget.';
    ELSE
        -- if no conflict, set bud_active to 1 if today falls within the budget date range
        IF CURDATE() BETWEEN NEW.bud_start_date AND NEW.bud_end_date THEN
            SET NEW.bud_active = 1;
        END IF;
    END IF;
END //
DELIMITER ;

-- same trigger, this time for updating
DELIMITER //
CREATE TRIGGER before_update_budget
BEFORE UPDATE ON budget
FOR EACH ROW
BEGIN
    DECLARE date_conflict INT;

    -- only check for overlap if bud_start_date or bud_end_date is being updated
    IF NEW.bud_start_date <> OLD.bud_start_date OR NEW.bud_end_date <> OLD.bud_end_date THEN
        -- check for any overlapping date ranges for the same user, excluding the current record being updated
        SELECT COUNT(*)
        INTO date_conflict
        FROM budget
        WHERE user_id = NEW.user_id
          AND bud_seq <> OLD.bud_seq -- exclude the current budget entry
          AND (
              (NEW.bud_start_date BETWEEN bud_start_date AND bud_end_date)
              OR (NEW.bud_end_date BETWEEN bud_start_date AND bud_end_date)
              OR (bud_start_date BETWEEN NEW.bud_start_date AND NEW.bud_end_date)
              OR (bud_end_date BETWEEN NEW.bud_start_date AND NEW.bud_end_date)
          );

       -- if there is a conflict, signal an error
        IF date_conflict > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'date range conflict: the updated budget dates overlap with an existing budget';
        ELSE
            -- if no conflict, set bud_active to 1 if today falls within the updated budget date range
            IF CURDATE() BETWEEN NEW.bud_start_date AND NEW.bud_end_date THEN
                SET NEW.bud_active = 1;
            ELSE
                SET NEW.bud_active = 0; -- ensure bud_active is 0 if outside the range
            END IF;
        END IF;

    END IF;
END //
DELIMITER ;

-- event: if today is within a budget instance date, then turn bud_active to 1
DELIMITER //
CREATE EVENT current_active_budget
ON SCHEDULE EVERY 1 DAY
	STARTS CURRENT_TIMESTAMP()
ON COMPLETION PRESERVE
DO
BEGIN
	-- set bud_active to 1 if today's date is within the budget date range
    UPDATE budget
    SET bud_active = 1
    WHERE CURDATE() BETWEEN bud_start_date AND bud_end_date;

    -- set bud_active to 0 for budgets outside the date range
    UPDATE budget
    SET bud_active = 0
    WHERE CURDATE() NOT BETWEEN bud_start_date AND bud_end_date;
END //
DELIMITER ;
