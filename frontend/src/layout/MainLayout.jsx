import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Button, theme, Avatar, Dropdown, Typography,
} from 'antd';
import {
  DashboardOutlined, TagOutlined, LaptopOutlined,
  ScanOutlined, UserOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout, getMe } from '../redux/slices/authSlice';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/tags', icon: <TagOutlined />, label: 'Tag များ' },
  { key: '/devices', icon: <LaptopOutlined />, label: 'Device များ' },
  { key: '/scanlogs', icon: <ScanOutlined />, label: 'Scan Logs' },
  { key: '/users', icon: <UserOutlined />, label: 'User များ' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  // App reload လုပ်ရင် token ရှိရင် user data ပြန်ယူ
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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text strong style={{ color: '#fff', fontSize: collapsed ? 14 : 18, whiteSpace: 'nowrap' }}>
            {collapsed ? 'RFID' : 'RFID စနစ်'}
          </Text>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}
          items={menuItems} onClick={handleMenuClick} />
      </Sider>

      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)} />
          <Dropdown menu={{ items: userMenuItems }}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <Text>{user?.name || 'User'}</Text>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}