CREATE TABLE expense (
	user_id INT UNSIGNED NOT NULL,
    exp_seq INT UNSIGNED NOT NULL,
    exp_amt DECIMAL(10, 2) NOT NULL,
    exp_desc TEXT,
    exp_date DATE DEFAULT (DATE(SYSDATE())),
    exp_cat VARCHAR(50) NOT NULL,
    exp_active BOOL DEFAULT(1),
    PRIMARY KEY (user_id, exp_seq),
    FOREIGN KEY (user_id) 
		REFERENCES user (user_id)
        ON DELETE CASCADE,
	CONSTRAINT exp_cat_allowed_values
		CHECK (exp_cat IN 
					('food & dining', 'transportation', 'housing', 'utilities', 'healthcare',
					'insurance', 'debt payments', 'entertainment', 'clothing', 'education', 
					'gifts & donations', 'savings & investments', 'personal care', 'travel', 'miscellaneous')
		)
);

-- expense category only allows several values