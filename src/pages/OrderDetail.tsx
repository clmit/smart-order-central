import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getOrderById, updateOrder, deleteOrder } from '@/lib/api';
import { Order, OrderItem } from '@/types';
import ImageUpload from '@/components/order/ImageUpload';
import { formatOrderId } from '@/lib/orderUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemPhoto, setNewItemPhoto] = useState('');
  const [status, setStatus] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!id) return;

      try {
        const orderData = await getOrderById(id);
        if (orderData) {
          setOrder(orderData);
          setOrderItems(orderData.items);
          setStatus(orderData.status);
        } else {
          toast({
            title: "Ошибка",
            description: "Заказ не найден",
            variant: "destructive"
          });
          navigate('/orders');
        }
      } catch (error) {
        console.error('Failed to load order details:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные заказа",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderDetails();
  }, [id, navigate, toast]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  const handleSaveOrder = async () => {
    if (!order) return;

    setIsSubmitting(true);
    try {
      // Calculate total
      const totalAmount = orderItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );

      const updatedOrder = await updateOrder(order.id, {
        status: status as any,
        items: orderItems,
        totalAmount
      });

      if (updatedOrder) {
        setOrder(updatedOrder);
        setIsEditing(false);
        toast({
          title: "Заказ обновлен",
          description: "Изменения успешно сохранены"
        });
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice) {
      toast({
        title: "Не заполнены поля",
        description: "Заполните название и цену товара",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(newItemPrice);
    const quantity = parseInt(newItemQuantity, 10) || 1;

    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      name: newItemName,
      description: newItemDescription,
      price,
      quantity,
      photoUrl: newItemPhoto || undefined
    };

    setOrderItems([...orderItems, newItem]);
    
    // Reset fields
    setNewItemName('');
    setNewItemDescription('');
    setNewItemPrice('');
    setNewItemQuantity('1');
    setNewItemPhoto('');
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const handleUpdateItemQuantity = (itemId: string, newQuantity: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleUpdateItemPhoto = (itemId: string, photoUrl: string) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        return { ...item, photoUrl: photoUrl || undefined };
      }
      return item;
    }));
  };

  const handleDeleteOrder = async () => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      const success = await deleteOrder(id);
      
      if (success) {
        toast({
          title: "Заказ удален",
          description: "Заказ был успешно удален"
        });
        navigate('/orders');
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'website': return 'Сайт';
      case 'phone': return 'Телефон';
      case 'store': return 'Магазин';
      case 'referral': return 'Реферал';
      default: return 'Другое';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-5 w-5" />;
      case 'processing':
        return <Clock className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-amber-100 text-amber-500';
      case 'processing':
        return 'bg-crm-blue-light text-crm-blue';
      case 'completed':
        return 'bg-crm-green-light text-crm-green';
      case 'cancelled':
        return 'bg-crm-red-light text-crm-red';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'processing': return 'В обработке';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Загрузка данных заказа...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Заказ не найден</p>
      </div>
    );
  }

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к заказам
        </Button>
        
        <div className="ml-auto flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Отменить
              </Button>
              <Button onClick={handleSaveOrder} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление заказа</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row items-center justify-between bg-card rounded-lg px-6 py-4 border">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <h1 className="text-2xl font-bold">Заказ {formatOrderId(order.id)}</h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusClass(order.status)}`}>
            {getStatusIcon(order.status)}
            {getStatusLabel(order.status)}
          </div>
        </div>
        <div className="text-muted-foreground mt-2 sm:mt-0">
          {formatDate(order.date)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Информация о клиенте</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Имя</Label>
              <div className="font-medium">{order.customer?.name || 'Не указано'}</div>
            </div>
            <div>
              <Label>Телефон</Label>
              <div className="font-medium">{order.customer?.phone || 'Не указано'}</div>
            </div>
            <div>
              <Label>Адрес</Label>
              <div className="font-medium">{order.customer?.address || 'Не указано'}</div>
            </div>
            {order.customer?.email && (
              <div>
                <Label>Email</Label>
                <div className="font-medium">{order.customer.email}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Информация о заказе</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Источник заказа</Label>
              <div className="font-medium">{getSourceLabel(order.source)}</div>
            </div>
            <div>
              <Label>Дата заказа</Label>
              <div className="font-medium">{formatDate(order.date)}</div>
            </div>
            <div>
              <Label>Статус</Label>
              {isEditing ? (
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новый</SelectItem>
                    <SelectItem value="processing">В обработке</SelectItem>
                    <SelectItem value="completed">Завершен</SelectItem>
                    <SelectItem value="cancelled">Отменен</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusClass(order.status)} inline-flex mt-1`}>
                  {getStatusIcon(order.status)}
                  {getStatusLabel(order.status)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Товары</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Фото товара */}
                  <div className="space-y-2">
                    <Label>Фото товара</Label>
                    {isEditing ? (
                      <ImageUpload 
                        onImageUploaded={(url) => handleUpdateItemPhoto(item.id, url)}
                        currentImage={item.photoUrl}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        {item.photoUrl ? (
                          <img 
                            src={item.photoUrl} 
                            alt={item.name} 
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">Фото не загружено</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Информация о товаре */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Название</Label>
                        <div className="font-medium text-lg">{item.name}</div>
                      </div>
                      <div>
                        <Label>Цена</Label>
                        <div className="font-medium text-lg">{formatCurrency(item.price)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Описание</Label>
                      <div className="text-muted-foreground">
                        {item.description || 'Описание отсутствует'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <Label>Количество</Label>
                          {isEditing ? (
                            <Input
                              type="number"
                              className="w-20"
                              value={item.quantity}
                              min={1}
                              onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                            />
                          ) : (
                            <div className="font-medium">{item.quantity} шт.</div>
                          )}
                        </div>
                        <div>
                          <Label>Сумма</Label>
                          <div className="font-bold text-lg">{formatCurrency(item.price * item.quantity)}</div>
                        </div>
                      </div>
                      
                      {isEditing && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isEditing && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-4">Добавить новый товар</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Фото товара</Label>
                    <ImageUpload 
                      onImageUploaded={(url) => setNewItemPhoto(url)}
                      currentImage={newItemPhoto}
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Название *</Label>
                        <Input 
                          placeholder="Название товара" 
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Цена *</Label>
                        <Input 
                          type="number"
                          placeholder="0.00"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Описание</Label>
                      <Input 
                        placeholder="Описание товара (опционально)" 
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Количество</Label>
                        <Input 
                          type="number"
                          className="w-20"
                          value={newItemQuantity}
                          min={1}
                          onChange={(e) => setNewItemQuantity(e.target.value)}
                        />
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={handleAddItem}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить товар
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-end">
              <div className="text-right">
                <div className="text-muted-foreground">Итого:</div>
                <div className="text-2xl font-bold">{formatCurrency(total)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Отменить
          </Button>
          <Button onClick={handleSaveOrder} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            Сохранить заказ
          </Button>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
