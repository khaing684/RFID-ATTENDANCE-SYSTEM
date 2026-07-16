import { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Select, Card, Row, Col, Typography, Statistic, message, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../config/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function ScanLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ scanType: '' });
  const [stats, setStats] = useState(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (filters.scanType) params.scanType = filters.scanType;
      const { data } = await api.get('/scanlogs', { params });
      setLogs(data.logs || data.scanLogs || []);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch { message.error('Scan logs ဖတ်မရပါ'); }
    finally { setLoading(false); }
  }, [filters, pagination.limit]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/scanlogs/stats');
      setStats(data.stats);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchLogs(); fetchStats(); }, [fetchLogs]);

  const scanTypeMap = {
    CHECK_IN: { color: 'green', text: 'Check In' },
    CHECK_OUT: { color: 'orange', text: 'Check Out' },
    INVENTORY: { color: 'blue', text: 'Inventory' },
    LOCATE: { color: 'purple', text: 'Locate' },
  };

  const columns = [
    { title: 'RFID Code', key: 'rfidCode', width: 140, render: (_, r) => <Tag color="blue">{r.tag?.rfidCode || '-'}</Tag> },
    { title: 'Device', key: 'device', width: 130, render: (_, r) => r.device?.name || '-' },
    { title: 'User', key: 'user', width: 120, render: (_, r) => r.user?.name || '-' },
    { title: 'Scan အမျိုးအစား', dataIndex: 'scanType', width: 120, render: (v) => <Tag color={scanTypeMap[v]?.color}>{scanTypeMap[v]?.text || v}</Tag> },
    { title: 'မှတ်ချက်', dataIndex: 'notes', ellipsis: true, render: (v) => v || '-' },
    { title: 'အချိန်', dataIndex: 'scannedAt', width: 170, render: (v) => new Date(v).toLocaleString('my-MM') },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}><Title level={4} style={{ margin: 0 }}>Scan Logs</Title></Card>

      {/* Stats */}
      {stats && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[24, 16]}>
            <Col span={6}><Statistic title="စုစုပေါင်း Scan" value={stats.total || 0} /></Col>
            <Col span={6}><Statistic title="Check In" value={stats.checkIns || stats.CHECK_IN || 0} valueStyle={{ color: '#52c41a' }} /></Col>
            <Col span={6}><Statistic title="Check Out" value={stats.checkOuts || stats.CHECK_OUT || 0} valueStyle={{ color: '#faad14' }} /></Col>
            <Col span={6}><Statistic title="ဒီနေ့" value={stats.today || 0} valueStyle={{ color: '#1677ff' }} /></Col>
          </Row>
        </Card>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Select placeholder="Scan အမျိုးအစား" allowClear style={{ width: 150 }} value={filters.scanType || undefined}
              onChange={(v) => setFilters((f) => ({ ...f, scanType: v || '' }))}
              options={[{ value: 'CHECK_IN', label: 'Check In' }, { value: 'CHECK_OUT', label: 'Check Out' }, { value: 'INVENTORY', label: 'Inventory' }, { value: 'LOCATE', label: 'Locate' }]} />
          </Col>
          <Col><RangePicker /></Col>
          <Col><ReloadOutlined onClick={() => { setFilters({ scanType: '' }); }} style={{ fontSize: 18, cursor: 'pointer', color: '#1677ff' }} /></Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table rowKey="id" columns={columns} dataSource={logs} loading={loading} scroll={{ x: 800 }}
          pagination={{ current: pagination.page, pageSize: pagination.limit, total: pagination.total, showSizeChanger: true, showTotal: (t) => `စုစုပေါင်း ${t} ခု`, onChange: (p, s) => setPagination((prev) => ({ ...prev, page: p, limit: s })) }} />
      </Card>
    </>
  );
}
