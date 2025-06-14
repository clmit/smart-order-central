
-- Найти максимальный номер заказа и обновить последовательность
DO $$
DECLARE
    max_order_num INTEGER;
BEGIN
    -- Получить максимальный номер заказа
    SELECT COALESCE(MAX(order_number), 0) INTO max_order_num FROM orders;
    
    -- Установить последовательность на следующее значение после максимального
    EXECUTE format('ALTER SEQUENCE orders_order_number_seq RESTART WITH %s', max_order_num + 1);
    
    -- Вывести информацию для отладки
    RAISE NOTICE 'Максимальный номер заказа: %, последовательность установлена на: %', max_order_num, max_order_num + 1;
END $$;
