CREATE TABLE setting (
	user_id INT UNSIGNED PRIMARY KEY,
    page_mode VARCHAR(10) DEFAULT('light'),
    curr_code VARCHAR(3) DEFAULT('USD'),
    FOREIGN KEY (user_id)
		REFERENCES user (user_id)
        ON DELETE CASCADE,
	FOREIGN KEY (curr_code)
		REFERENCES currency (curr_code)
        ON UPDATE CASCADE,
	CONSTRAINT page_mode_allowed_values
		CHECK (page_mode IN ('light', 'dark'))
);