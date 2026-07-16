import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag } from 'antd';
import {
  TagOutlined, LaptopOutlined, ScanOutlined, UserOutlined,
  LoginOutlined, LogoutOutlined, WarningOutlined,
} from '@ant-design/icons';
import api from '../../config/api';

const { Title } = Typography;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard');
      setStats(data.stats);
      setRecentLogs(data.recentLogs || []);
    } catch (err) {
      console.log('Dashboard data not available from backend, using defaults');
    } finally {
      setLoading(false);
    }
  };

  // နောက်ဆုံး scan တွေရဲ့ type အလိုက် tag color
  const scanTypeMap = {
    CHECK_IN: { color: 'green', text: 'Check In' },
    CHECK_OUT: { color: 'orange', text: 'Check Out' },
    INVENTORY: { color: 'blue', text: 'Inventory' },
  };

  const recentColumns = [
    { title: 'User', dataIndex: ['user', 'name'], key: 'user' },
    { title: 'RFID Code', dataIndex: ['tag', 'rfidCode'], key: 'rfid' },
    {
      title: 'Scan Type', dataIndex: 'scanType', key: 'type',
      render: (type) => {
        const info = scanTypeMap[type] || { color: 'default', text: type };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: 'Device', dataIndex: ['device', 'name'], key: 'device' },
    {
      title: 'Time', dataIndex: 'createdAt', key: 'time',
      render: (d) => d ? new Date(d).toLocaleString('my-MM') : '-',
    },
  ];

  return (
    <div>
      <Title level={4}>📊 Dashboard</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="စုစုပေါင်း Tag"
              value={stats?.totalTags ?? '-'}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="စုစုပေါင်း Device"
              value={stats?.totalDevices ?? '-'}
              prefix={<LaptopOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="စုစုပေါင်း User"
              value={stats?.totalUsers ?? '-'}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="ဒီနေ့ Scan"
              value={stats?.todayScans ?? '-'}
              prefix={<ScanOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Tag"
              value={stats?.activeTags ?? '-'}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Online Devices"
              value={stats?.onlineDevices ?? '-'}
              prefix={<LaptopOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="ဒီနေ့ Check In"
              value={stats?.todayCheckIns ?? '-'}
              prefix={<LoginOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="ဒီနေ့ Check Out"
              value={stats?.todayCheckOuts ?? '-'}
              prefix={<LogoutOutlined />}
              valueStyle={{ color: '#faad14', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="⏱️ နောက်ဆုံး Scan များ" style={{ marginTop: 16 }}>
        <Table
          dataSource={recentLogs}
          columns={recentColumns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
          locale={{ emptyText: 'Scan data မရှိသေးပါ' }}
        />
      </Card>
    </div>
  );
}
