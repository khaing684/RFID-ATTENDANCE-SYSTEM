import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, Modal, Form, Popconfirm,
  Typography, Card, Row, Col, message, Tooltip, Badge,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, UserSwitchOutlined,
} from '@ant-design/icons';
import api from '../../config/api';

const { Title } = Typography;

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ status: '', tagType: '', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingTag, setEditingTag] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTagId, setAssignTagId] = useState(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  const fetchTags = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (filters.status) params.status = filters.status;
      if (filters.tagType) params.tagType = filters.tagType;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get('/tags', { params });
      setTags(data.tags);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch { message.error('Tag များ ဖတ်မရပါ'); }
    finally { setLoading(false); }
  }, [filters, pagination.limit]);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const handleOpenModal = (mode, record = null) => {
    setModalMode(mode);
    setEditingTag(record);
    if (record) form.setFieldsValue({ rfidCode: record.rfidCode, tagType: record.tagType, description: record.description, status: record.status });
    else form.resetFields();
    setModalOpen(true);
  };

  const handleClose = () => { setModalOpen(false); form.resetFields(); setEditingTag(null); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === 'create') { await api.post('/tags', values); message.success('Tag အသစ် ထည့်ပြီးပါပြီ'); }
      else { await api.patch(`/tags/${editingTag.id}`, values); message.success('Tag ပြင်ပြီးပါပြီ'); }
      handleClose(); fetchTags(pagination.page);
    } catch (err) { if (err.response) message.error(err.response.data?.message || 'မအောင်မြင်ပါ'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/tags/${id}`); message.success('ဖျက်ပြီးပါပြီ'); fetchTags(pagination.page); }
    catch { message.error('ဖျက်မရပါ'); }
  };

  const handleOpenAssign = (record) => { setAssignTagId(record.id); assignForm.setFieldsValue({ userId: record.assignedTo?.id || '' }); setAssignOpen(true); };

  const handleAssign = async () => {
    try {
      const { userId } = await assignForm.validateFields();
      if (userId) { await api.patch(`/tags/${assignTagId}/assign`, { userId }); message.success('Assign လုပ်ပြီး'); }
      else { await api.patch(`/tags/${assignTagId}/unassign`); message.success('Unassign လုပ်ပြီး'); }
      setAssignOpen(false); fetchTags(pagination.page);
    } catch (err) { message.error(err.response?.data?.message || 'မအောင်မြင်ပါ'); }
  };

  const statusMap = { ACTIVE: { color: 'green', text: 'Active' }, INACTIVE: { color: 'default', text: 'Inactive' }, LOST: { color: 'red', text: 'ပျောက်' }, DAMAGED: { color: 'orange', text: 'ပျက်စီး' } };

  const columns = [
    { title: 'RFID Code', dataIndex: 'rfidCode', width: 150, render: (t) => <Tag color="blue">{t}</Tag> },
    { title: 'အမျိုးအစား', dataIndex: 'tagType', width: 100, render: (v) => <Tag>{v === 'ACTIVE' ? 'Active' : 'Passive'}</Tag> },
    { title: 'အခြေအနေ', dataIndex: 'status', width: 110, render: (v) => <Badge status={v === 'ACTIVE' ? 'success' : v === 'LOST' ? 'error' : 'default'} text={statusMap[v]?.text || v} /> },
    { title: 'ပိုင်ဆိုင်သူ', key: 'owner', width: 130, render: (_, r) => r.assignedTo ? <Tooltip title={r.assignedTo.role}>{r.assignedTo.name}</Tooltip> : <Tag>မရှိ</Tag> },
    { title: 'မှတ်ချက်', dataIndex: 'description', ellipsis: true },
    { title: 'ရက်စွဲ', dataIndex: 'createdAt', width: 130, render: (v) => new Date(v).toLocaleDateString('my-MM') },
    { title: '', key: 'actions', width: 170, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal('edit', r)} />
        <Button size="small" icon={<UserSwitchOutlined />} onClick={() => handleOpenAssign(r)} />
        <Popconfirm title="ဖျက်မှာသေချာလား？" onConfirm={() => handleDelete(r.id)} okText="ဖျက်မည်" cancelText="မဖျက်ပါ">
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}><Row justify="space-between" align="middle"><Col><Title level={4} style={{ margin: 0 }}>Tag များ</Title></Col><Col><Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal('create')}>Tag အသစ်</Button></Col></Row></Card>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col><Input placeholder="RFID Code ရှာ..." prefix={<SearchOutlined />} allowClear style={{ width: 200 }} value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} /></Col>
          <Col><Select placeholder="အမျိုးအစား" allowClear style={{ width: 130 }} value={filters.tagType || undefined} onChange={(v) => setFilters((f) => ({ ...f, tagType: v || '' }))} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'PASSIVE', label: 'Passive' }]} /></Col>
          <Col><Select placeholder="အခြေအနေ" allowClear style={{ width: 130 }} value={filters.status || undefined} onChange={(v) => setFilters((f) => ({ ...f, status: v || '' }))} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }, { value: 'LOST', label: 'ပျောက်' }, { value: 'DAMAGED', label: 'ပျက်စီး' }]} /></Col>
          <Col><Button icon={<ReloadOutlined />} onClick={() => setFilters({ status: '', tagType: '', search: '' })}>ပြန်စမည်</Button></Col>
        </Row>
      </Card>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={tags} loading={loading} scroll={{ x: 1000 }}
          pagination={{ current: pagination.page, pageSize: pagination.limit, total: pagination.total, showSizeChanger: true, showTotal: (t) => `စုစုပေါင်း ${t} ခု`, onChange: (p, s) => setPagination((prev) => ({ ...prev, page: p, limit: s })) }} />
      </Card>
      <Modal title={modalMode === 'create' ? 'Tag အသစ်' : 'Tag ပြင်မည်'} open={modalOpen} onOk={handleSubmit} onCancel={handleClose} okText={modalMode === 'create' ? 'ထည့်မည်' : 'သိမ်းမည်'} cancelText="မလုပ်တော့ပါ" destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="rfidCode" label="RFID Code" rules={[{ required: true, message: 'RFID Code ထည့်ပါ' }]}><Input placeholder="ဥပမာ - RF-001" /></Form.Item>
          <Form.Item name="tagType" label="အမျိုးအစား" initialValue="PASSIVE"><Select options={[{ value: 'PASSIVE', label: 'Passive' }, { value: 'ACTIVE', label: 'Active' }]} /></Form.Item>
          <Form.Item name="status" label="အခြေအနေ" initialValue="ACTIVE"><Select options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }, { value: 'LOST', label: 'ပျောက်' }, { value: 'DAMAGED', label: 'ပျက်စီး' }]} /></Form.Item>
          <Form.Item name="description" label="မှတ်ချက်"><Input.TextArea rows={2} placeholder="ထည့်လိုပါက..." /></Form.Item>
        </Form>
      </Modal>
      <Modal title="Tag Assign" open={assignOpen} onOk={handleAssign} onCancel={() => setAssignOpen(false)} okText="သိမ်းမည်" cancelText="မလုပ်တော့ပါ" destroyOnClose>
        <Form form={assignForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="userId" label="User ID (ပိုင်ဆိုင်သူ)"><Input placeholder="User ID (မထည့်ရင် unassign)" allowClear /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
