import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Button, theme, Avatar, Dropdown, Typography,
} from 'antd';
import {
  DashboardOutlined, TagOutlined, LaptopOutlined,
  ScanOutlined, UserOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined,
  BarChartOutlined, TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout, getMe } from '../redux/slices/authSlice';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/tags', icon: <TagOutlined />, label: 'Tags' },
  { key: '/devices', icon: <LaptopOutlined />, label: 'Devices' },
  { key: '/scanlogs', icon: <ScanOutlined />, label: 'Scan Logs' },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },  { key: '/classes', icon: <TeamOutlined />, label: 'Classes' },  { key: '/timetable', icon: <ClockCircleOutlined />, label: 'Timetable' },  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth);
  const { token: { colorBgContainer } } = theme.useToken();

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe());
    }
  }, [dispatch, token, user]);

  const handleMenuClick = ({ key }) => navigate(key);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: handleLogout },
  ];

  return (
    // အပြင်ဘက်ဆုံး Layout ကြီးကို Screen အမြင့်ရော အကျယ်ပါ 100% ယူခိုင်းလိုက်ပါတယ်
    <Layout style={{ width: '100vw', height: '100vh', overflow: 'hidden' , top: 0, left: 0, position: 'fixed'}}>
      
      {/* Sider (Sidebar) ကို အမြင့် 100% ပြည့် စေပါတယ် */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
      >
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text strong style={{ color: '#fff', fontSize: 14, whiteSpace: 'nowrap' }}>
            {collapsed ? 'RFID SYSTEM' : 'RFID ATTENDANCE SYSTEM'}
          </Text>
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[location.pathname]}
          items={menuItems} 
          onClick={handleMenuClick}
          style={{ flex: 1, borderRight: 0 }} 
        />
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button
            type="text"
            block
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#fff' }}
          />
        </div>
      </Sider>

      {/* ညာဘက်ခြမ်း Layout (Header + Content) */}
      <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header အပိုင်း */}
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 64, flexShrink: 0 }}>
          <Dropdown menu={{ items: userMenuItems }}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <Text>{user?.name || 'User'}</Text>
            </div>
          </Dropdown>
        </Header>

        {/* Content အပိုင်းကို margin, padding တွေအကုန်ဖြုတ်ပြီး နေရာလွတ်မရှိ Screen အပြည့် ဆွဲဆန့်လိုက်ပါတယ် */}
        <Content 
          style={{ 
            background: '#f5f2f0', 
            flex: 1,                          // ကျန်တဲ့ နေရာအကုန်လုံးကို အောက်ခြေထိ အပြည့်ယူမယ်
            display: 'flex', 
            flexDirection: 'column',
            overflowY: 'auto',                // စာတွေများလာရင် Content ထဲမှာတင် scroll ဆွဲလို့ရမယ်
            padding: 0                        // ဘေးပတ်ပတ်လည် နေရာလွတ်မချန်ဘဲ အပြည့်ကပ်မယ်
          }}
        >
          <Outlet />
        </Content>

      </Layout>
    </Layout>
  );
}