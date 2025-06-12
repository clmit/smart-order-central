
-- Удаляем все данные из таблиц в правильном порядке (учитывая внешние ключи)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM customers;

-- Сбрасываем последовательность для order_number
ALTER SEQUENCE orders_order_number_seq RESTART WITH 1;
