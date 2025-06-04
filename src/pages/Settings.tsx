
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Settings() {
  const apiBaseUrl = window.location.origin;

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: message,
    });
  };

  const handleTestAPI = () => {
    // Тестовые данные для создания заказа
    const testData = {
      customerName: "Тестовый Клиент",
      customerPhone: "+7 (999) 123-4567",
      customerAddress: "Тестовый адрес",
      customerEmail: "test@example.com",
      source: "other",
      date: "2024-01-15T10:30:00Z", // Пример указания даты
      items: [
        {
          name: "Тестовый товар",
          description: "Описание товара",
          price: 1000,
          quantity: 1
        }
      ]
    };
    
    // Кодируем данные для передачи через URL
    const encodedData = encodeURIComponent(JSON.stringify(testData));
    
    // Открываем страницу создания заказа с тестовыми данными
    window.location.href = `${apiBaseUrl}/api/orders/create?data=${encodedData}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">Управление системой и интеграциями</p>
      </div>

      <Tabs defaultValue="api">
        <TabsList>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="system">Система</TabsTrigger>
        </TabsList>
        <TabsContent value="api" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>API для создания заказов</CardTitle>
              <CardDescription>
                Используйте этот API для создания заказов из внешних систем
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">Endpoint URL</p>
                <div className="flex items-center bg-muted p-2 rounded-md">
                  <code className="text-sm flex-1 break-all">{apiBaseUrl}/api/orders/create</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleCopy(`${apiBaseUrl}/api/orders/create`, 'URL скопирован')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium">Метод</p>
                <p className="bg-muted p-2 rounded-md">GET (с параметром data)</p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Формат запроса</p>
                <pre className="bg-muted p-2 rounded-md text-sm whitespace-pre-wrap">
                  {`{
  "customerName": "Имя клиента", // обязательно
  "customerPhone": "+7 (XXX) XXX-XXXX", // обязательно
  "customerAddress": "Адрес доставки",
  "customerEmail": "email@example.com",
  "source": "website", // website, phone, store, referral, other
  "date": "2024-01-15T10:30:00Z", // необязательно, ISO формат
  "items": [ // обязательно
    {
      "name": "Название товара", // обязательно
      "description": "Описание товара",
      "price": 1000, // обязательно
      "quantity": 1,
      "photoUrl": "https://example.com/photo.jpg"
    }
  ]
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Описание полей</p>
                <div className="bg-muted p-2 rounded-md text-sm space-y-1">
                  <p><strong>date</strong> - Дата заказа в формате ISO 8601 (например, "2024-01-15T10:30:00Z"). Поле необязательное - если не указано, будет использована текущая дата.</p>
                  <p><strong>source</strong> - Источник заказа: website, phone, store, referral, other</p>
                  <p><strong>customerName, customerPhone</strong> - Обязательные поля</p>
                  <p><strong>items</strong> - Массив товаров, обязательно должен содержать хотя бы один товар</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-medium">Пример ответа</p>
                <pre className="bg-muted p-2 rounded-md text-sm whitespace-pre-wrap">
                  {`{
  "id": "uuid",
  "customerId": "uuid",
  "customer": {
    "id": "uuid",
    "name": "Имя клиента",
    "phone": "+7 (XXX) XXX-XXXX",
    "address": "Адрес доставки",
    "email": "email@example.com",
    "createdAt": "2023-05-10T10:00:00Z",
    "totalOrders": 1,
    "totalSpent": 1000
  },
  "date": "2024-01-15T10:30:00Z",
  "source": "website",
  "status": "new",
  "orderNumber": 1,
  "items": [
    {
      "id": "uuid",
      "name": "Название товара",
      "description": "Описание товара",
      "price": 1000,
      "quantity": 1,
      "photoUrl": "https://example.com/photo.jpg"
    }
  ],
  "totalAmount": 1000
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Пример кода (fetch)</p>
                <pre className="bg-muted p-2 rounded-md text-sm whitespace-pre-wrap">
                  {`// Создаем объект с данными заказа
const orderData = {
  customerName: "Имя клиента",
  customerPhone: "+7 (XXX) XXX-XXXX",
  customerAddress: "Адрес доставки",
  customerEmail: "email@example.com",
  source: "website",
  date: "2024-01-15T10:30:00Z", // необязательно
  items: [
    {
      name: "Название товара",
      description: "Описание товара",
      price: 1000,
      quantity: 1,
      photoUrl: "https://example.com/photo.jpg"
    }
  ]
};

// Кодируем данные для передачи через URL
const encodedData = encodeURIComponent(JSON.stringify(orderData));

// Перенаправляем пользователя на страницу создания заказа
window.location.href = "${apiBaseUrl}/api/orders/create?data=" + encodedData;`}
                </pre>
              </div>
              
              <div className="mt-4">
                <Button onClick={handleTestAPI}>
                  Протестировать API (создать тестовый заказ с датой)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="system" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Системные настройки</CardTitle>
              <CardDescription>
                Общие настройки системы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Раздел в разработке</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Settings;
