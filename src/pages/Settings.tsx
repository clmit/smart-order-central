
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

  const handleTestAPI = async () => {
    try {
      // Тестовые данные для создания заказа
      const testData = {
        customerName: "Тестовый Клиент",
        customerPhone: "+7 (999) 123-4567",
        customerAddress: "Тестовый адрес",
        customerEmail: "test@example.com",
        source: "other",
        date: "2024-01-15T10:30:00Z",
        orderNumber: "CL00999",
        items: [
          {
            name: "Тестовый товар",
            description: "Описание товара",
            price: 1000,
            quantity: 1
          }
        ]
      };
      
      // Отправляем POST запрос на Supabase Edge Function
      const response = await fetch('https://dzuyeaqwdkpegosfhooz.supabase.co/functions/v1/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dXllYXF3ZGtwZWdvc2Zob296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzYxNjEsImV4cCI6MjA2MjQxMjE2MX0.ZWjpNN7kVc7d8D8H4hSYyHlKu2TRSXEK9L172mX49Bg'}`
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Успех",
          description: `Тестовый заказ создан! ID: ${result.id}`,
        });
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось создать заказ",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка при создании заказа",
        variant: "destructive",
      });
      console.error('Error testing API:', error);
    }
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
                  <code className="text-sm flex-1 break-all">https://dzuyeaqwdkpegosfhooz.supabase.co/functions/v1/create-order</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleCopy('https://dzuyeaqwdkpegosfhooz.supabase.co/functions/v1/create-order', 'URL скопирован')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium">Метод</p>
                <p className="bg-muted p-2 rounded-md">POST</p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Заголовки</p>
                <pre className="bg-muted p-2 rounded-md text-sm whitespace-pre-wrap">
                  {`Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY`}
                </pre>
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
  "orderNumber": "CL00001", // необязательно, формат CL00001
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
                  <p><strong>orderNumber</strong> - Номер заказа в формате CL00001 (например, "CL00001", "CL00999"). Поле необязательное - если не указано, будет автоматически назначен следующий доступный номер.</p>
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
  orderNumber: "CL00001", // необязательно
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

// Отправляем POST запрос
const response = await fetch('https://dzuyeaqwdkpegosfhooz.supabase.co/functions/v1/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
  },
  body: JSON.stringify(orderData)
});

const result = await response.json();
if (response.ok) {
  console.log('Заказ создан:', result);
} else {
  console.error('Ошибка:', result.error);
}`}
                </pre>
              </div>
              
              <div className="mt-4">
                <Button onClick={handleTestAPI}>
                  Протестировать API (создать тестовый заказ с номером)
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
