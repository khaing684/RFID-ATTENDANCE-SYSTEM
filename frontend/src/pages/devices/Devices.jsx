import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, Popconfirm, Typography, Card, Row, Col, message, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, WifiOutlined } from '@ant-design/icons';
import api from '../../config/api';

const { Title } = Typography;

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ status: '', deviceType: '', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingDevice, setEditingDevice] = useState(null);
  const [form] = Form.useForm();

  const fetchDevices = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (filters.status) params.status = filters.status;
      if (filters.deviceType) params.deviceType = filters.deviceType;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get('/devices', { params });
      setDevices(data.devices);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch { message.error('Device များ ဖတ်မရပါ'); }
    finally { setLoading(false); }
  }, [filters, pagination.limit]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleOpenModal = (mode, record = null) => {
    setModalMode(mode);
    setEditingDevice(record);
    if (record) form.setFieldsValue({ name: record.name, deviceCode: record.deviceCode, deviceType: record.deviceType, location: record.location, ipAddress: record.ipAddress, firmwareVersion: record.firmwareVersion, status: record.status });
    else form.resetFields();
    setModalOpen(true);
  };

  const handleClose = () => { setModalOpen(false); form.resetFields(); setEditingDevice(null); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === 'create') { await api.post('/devices', values); message.success('Device အသစ် ထည့်ပြီး'); }
      else { await api.patch(`/devices/${editingDevice.id}`, values); message.success('Device ပြင်ပြီး'); }
      handleClose(); fetchDevices(pagination.page);
    } catch (err) { if (err.response) message.error(err.response.data?.message || 'မအောင်မြင်ပါ'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/devices/${id}`); message.success('ဖျက်ပြီး'); fetchDevices(pagination.page); }
    catch { message.error('ဖျက်မရပါ'); }
  };

  const handleHeartbeat = async (id) => {
    try { await api.patch(`/devices/${id}/heartbeat`); message.success('Heartbeat ပို့ပြီး'); fetchDevices(pagination.page); }
    catch { message.error('Heartbeat ပို့မရပါ'); }
  };

  const statusMap = { ONLINE: { color: 'green', text: 'Online' }, OFFLINE: { color: 'red', text: 'Offline' }, MAINTENANCE: { color: 'orange', text: 'Maintenance' }, ERROR: { color: 'red', text: 'Error' } };

  const columns = [
    { title: 'အမည်', dataIndex: 'name', width: 150 },
    { title: 'ကုဒ်', dataIndex: 'deviceCode', width: 130, render: (t) => <Tag color="blue">{t}</Tag> },
    { title: 'အမျိုးအစား', dataIndex: 'deviceType', width: 100, render: (v) => <Tag>{v === 'HANDHELD' ? 'Handheld' : v === 'FIXED' ? 'Fixed' : 'USB'}</Tag> },
    { title: 'တည်နေရာ', dataIndex: 'location', width: 120, render: (v) => v || '-' },
    { title: 'IP', dataIndex: 'ipAddress', width: 140, render: (v) => v ? <Tag>{v}</Tag> : '-' },
    { title: 'အခြေအနေ', dataIndex: 'status', width: 110, render: (v) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: 'Scan အရေအတွက်', key: 'scans', width: 120, render: (_, r) => r._count?.scanLogs || 0 },
    { title: 'နောက်ဆုံးအချိန်', dataIndex: 'lastSeenAt', width: 140, render: (v) => v ? new Date(v).toLocaleString('my-MM') : 'မရှိ' },
    { title: '', key: 'actions', width: 170, render: (_, r) => (
      <Space>
        <Tooltip title="Heartbeat"><Button size="small" icon={<WifiOutlined />} onClick={() => handleHeartbeat(r.id)} /></Tooltip>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal('edit', r)} />
        <Popconfirm title="ဖျက်မှာသေချာလား？" onConfirm={() => handleDelete(r.id)} okText="ဖျက်မည်" cancelText="မဖျက်ပါ">
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}><Row justify="space-between" align="middle"><Col><Title level={4} style={{ margin: 0 }}>Device များ</Title></Col><Col><Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal('create')}>Device အသစ်</Button></Col></Row></Card>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col><Input placeholder="အမည်/ကုဒ် ရှာ..." prefix={<SearchOutlined />} allowClear style={{ width: 200 }} value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} /></Col>
          <Col><Select placeholder="အမျိုးအစား" allowClear style={{ width: 130 }} value={filters.deviceType || undefined} onChange={(v) => setFilters((f) => ({ ...f, deviceType: v || '' }))} options={[{ value: 'HANDHELD', label: 'Handheld' }, { value: 'FIXED', label: 'Fixed' }, { value: 'USB', label: 'USB' }]} /></Col>
          <Col><Select placeholder="အခြေအနေ" allowClear style={{ width: 130 }} value={filters.status || undefined} onChange={(v) => setFilters((f) => ({ ...f, status: v || '' }))} options={[{ value: 'ONLINE', label: 'Online' }, { value: 'OFFLINE', label: 'Offline' }, { value: 'MAINTENANCE', label: 'Maintenance' }, { value: 'ERROR', label: 'Error' }]} /></Col>
          <Col><Button icon={<ReloadOutlined />} onClick={() => setFilters({ status: '', deviceType: '', search: '' })}>ပြန်စမည်</Button></Col>
        </Row>
      </Card>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={devices} loading={loading} scroll={{ x: 1100 }}
          pagination={{ current: pagination.page, pageSize: pagination.limit, total: pagination.total, showSizeChanger: true, showTotal: (t) => `စုစုပေါင်း ${t} ခု`, onChange: (p, s) => setPagination((prev) => ({ ...prev, page: p, limit: s })) }} />
      </Card>
      <Modal title={modalMode === 'create' ? 'Device အသစ်' : 'Device ပြင်မည်'} open={modalOpen} onOk={handleSubmit} onCancel={handleClose} okText={modalMode === 'create' ? 'ထည့်မည်' : 'သိမ်းမည်'} cancelText="မလုပ်တော့ပါ" destroyOnClose width={560}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="အမည်" rules={[{ required: true, message: 'ထည့်ပါ' }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="deviceCode" label="Device Code" rules={[{ required: true, message: 'ထည့်ပါ' }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="deviceType" label="အမျိုးအစား" initialValue="HANDHELD"><Select options={[{ value: 'HANDHELD', label: 'Handheld' }, { value: 'FIXED', label: 'Fixed' }, { value: 'USB', label: 'USB' }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="အခြေအနေ" initialValue="OFFLINE"><Select options={[{ value: 'ONLINE', label: 'Online' }, { value: 'OFFLINE', label: 'Offline' }, { value: 'MAINTENANCE', label: 'Maintenance' }, { value: 'ERROR', label: 'Error' }]} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="location" label="တည်နေရာ"><Input placeholder="ဥပမာ - အဆောင် A" /></Form.Item></Col>
            <Col span={12}><Form.Item name="ipAddress" label="IP Address"><Input placeholder="192.168.1.1" /></Form.Item></Col>
          </Row>
          <Form.Item name="firmwareVersion" label="Firmware Version"><Input placeholder="v1.0.0" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
