
-- Принудительно установить последовательность на 16111
ALTER SEQUENCE orders_order_number_seq RESTART WITH 16111;

-- Проверить текущее значение последовательности
SELECT nextval('orders_order_number_seq');
SELECT setval('orders_order_number_seq', 16110);
SELECT nextval('orders_order_number_seq');
