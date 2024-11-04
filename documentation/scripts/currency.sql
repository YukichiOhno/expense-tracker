CREATE TABLE currency (
	curr_code CHAR(3) NOT NULL PRIMARY KEY,
    curr_name VARCHAR(50) NOT NULL UNIQUE,
    dollar_to_curr DECIMAL(10, 4) NOT NULL,
    curr_sign VARCHAR(3) NOT NULL
);

SELECT * FROM currency;

INSERT INTO currency VALUES ('USD', 'united states dollar', '1', '$');

INSERT INTO currency VALUES ('EUR', 'euro', '0.92', '€');

INSERT INTO currency VALUES ('GBP', 'british pound sterling', '0.77', '£');

INSERT INTO currency VALUES ('JPY', 'japanese yen', '152.17', '¥');

INSERT INTO currency VALUES ('AUD', 'australian dollar', '1.52', '$');

INSERT INTO currency VALUES ('CAD', 'canadian dollar', '1.39', '$');

INSERT INTO currency VALUES ('CHF', 'swiss franc', '0.86', 'CHF');

INSERT INTO currency VALUES ('CNY', 'chinese yuan', '7.10', '¥');

INSERT INTO currency VALUES ('INR', 'indian rupee', '84.17', '₹');

INSERT INTO currency VALUES ('RUB', 'russian rubble', '99.00', '₽');

INSERT INTO currency VALUES ('BRL', 'brazilian real', '5.79', 'R$');

INSERT INTO currency VALUES ('ZAR', 'south african rand', '15.72', 'R');

INSERT INTO currency VALUES ('MXN', 'mexican peso', '20.10', '$');

INSERT INTO currency VALUES ('SGD', 'singapore dollar', '1.32', '$');

INSERT INTO currency VALUES ('NZD', 'new zealand dollar', '1.67', '$');

INSERT INTO currency VALUES ('HKD', 'hong kong dollar', '7.77', 'HK$');