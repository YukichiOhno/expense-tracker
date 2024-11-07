CREATE TABLE user (
	user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_number CHAR(14) NOT NULL UNIQUE,
    user_first VARCHAR(50) NOT NULL,
    user_last VARCHAR(50) NOT NULL,
    user_initial CHAR(1),
    user_email VARCHAR(100) NOT NULL UNIQUE,
    user_phone CHAR(10) UNIQUE,
    user_password VARCHAR(150) NOT NULL,
    user_created DATE DEFAULT (DATE(SYSDATE())),
    user_active BOOL DEFAULT(1),
    CONSTRAINT user_email_check
		CHECK (user_email LIKE '%_@_%._%'),
	CONSTRAINT user_phone_check 
		CHECK (user_phone REGEXP '^[0-9]{10}$')
);

ALTER TABLE user
ADD user_username VARCHAR(50) NOT NULL UNIQUE;

ALTER TABLE user
ADD CONSTRAINT user_username_check CHECK (user_username NOT REGEXP '\\s');

ALTER TABLE user
ADD CONSTRAINT user_initial_check CHECK (user_initial REGEXP '^[a-z]$');

-- email constraint: a user email must always be in a certain format, for example: someone@gmail.comm
-- phone constraint: phone must always be 10 digits and all numerical
SELECT * FROM user;

-- immediately create a settings row instance after a user is created
DELIMITER //
CREATE TRIGGER after_insert_user
AFTER INSERT ON user
FOR EACH ROW
BEGIN
	INSERT INTO setting (user_id) VALUES (NEW.user_id);
END // 
DELIMITER ;