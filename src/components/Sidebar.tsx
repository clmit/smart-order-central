
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import {
  ChartBar,
  FileText,
  Users,
  BarChart2,
  MessageSquare,
  Home,
  Settings
} from 'lucide-react';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { title: 'Дашборд', icon: Home, path: '/' },
    { title: 'Заказы', icon: FileText, path: '/orders' },
    { title: 'Клиенты', icon: Users, path: '/customers' },
    { title: 'Статистика', icon: BarChart2, path: '/statistics' },
    { title: 'Рассылка', icon: MessageSquare, path: '/messaging' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <SidebarContainer>
      <SidebarHeader className="py-4">
        <div className="flex items-center px-4">
          <ChartBar className="h-8 w-8 text-crm-blue" />
          <span className="text-xl font-semibold ml-2">CRM Система</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    className={isActive(item.path) ? 'bg-crm-blue-light text-crm-blue' : ''}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon size={20} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <button 
          className="w-full flex items-center p-2 text-crm-gray-dark hover:bg-crm-gray-light rounded-md"
          onClick={() => navigate('/settings')}
        >
          <Settings size={20} className="mr-2" />
          <span>Настройки</span>
        </button>
      </SidebarFooter>
    </SidebarContainer>
  );
}

export default Sidebar;
