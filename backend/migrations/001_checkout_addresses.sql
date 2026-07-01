CREATE TABLE IF NOT EXISTS checkout_addresses (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  user_id       INT NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(20),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  country       VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  postal_code   VARCHAR(20),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
