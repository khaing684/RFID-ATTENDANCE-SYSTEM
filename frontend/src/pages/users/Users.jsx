import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Tag, Select, Modal, Form,
  Typography, Card, Row, Col, message, Popconfirm, Input,
} from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../config/api';

const { Title } = Typography;

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (filters.role) params.role = filters.role;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get('/users', { params });
      setUsers(data.users);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch {
      message.error('Users ဖတ်မရပါ');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const roleMap = { ADMIN: { color: 'red', text: 'Admin' }, TEACHER: { color: 'blue', text: 'Teacher' }, STUDENT: { color: 'green', text: 'Student' } };

  const handleOpenModal = (mode, record = null) => {
    setModalMode(mode);
    setEditingUser(record);
    if (record) {
      form.setFieldsValue({ name: record.name, email: record.email, role: record.role, phone: record.phone, isActive: record.isActive });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('User ဖျက်ပြီးပါပြီ');
      fetchUsers();
    } catch {
      message.error('ဖျက်မရပါ');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === 'create') {
        await api.post('/users', values);
        message.success('User အသစ်ထည့်ပြီးပါပြီ');
      } else {
        await api.patch(`/users/${editingUser.id}`, values);
        message.success('User ပြင်ပြီးပါပြီ');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      if (err.response) message.error(err.response.data?.message || 'Error');
    }
  };

  const columns = [
    { title: 'အမည်', dataIndex: 'name', width: 150 },
    { title: 'Email', dataIndex: 'email', width: 200 },
    { title: 'Role', dataIndex: 'role', width: 100, render: (v) => <Tag color={roleMap[v]?.color}>{roleMap[v]?.text || v}</Tag> },
    { title: 'ဖုန်း', dataIndex: 'phone', width: 130, render: (v) => v || '-' },
    { title: 'အခြေအနေ', dataIndex: 'isActive', width: 100, render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag> },
    { title: 'ရက်စွဲ', dataIndex: 'createdAt', width: 130, render: (v) => new Date(v).toLocaleDateString('my-MM') },
    { title: '', key: 'actions', width: 120, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal('edit', r)} />
        <Popconfirm title="ဖျက်မှာသေချာလား?" okText="ဖျက်မည်" cancelText="မဖျက်ပါ" onConfirm={() => handleDelete(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col><Title level={4} style={{ margin: 0 }}>👥 User များ</Title></Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal('create')}>
              User အသစ်
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col><Input placeholder="အမည်/Email ရှာ..." prefix={<SearchOutlined />} allowClear style={{ width: 220 }} value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} /></Col>
          <Col><Select placeholder="Role" allowClear style={{ width: 130 }} value={filters.role || undefined} onChange={(v) => setFilters((f) => ({ ...f, role: v || '' }))} options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'TEACHER', label: 'Teacher' }, { value: 'STUDENT', label: 'Student' }]} /></Col>
          <Col><Button icon={<ReloadOutlined />} onClick={() => { setFilters({ role: '', search: '' }); fetchUsers(1); }}>ပြန်စမည်</Button></Col>
        </Row>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={users} loading={loading} scroll={{ x: 900 }}
          pagination={{
            current: pagination.page,
            total: pagination.total,
            pageSize: pagination.limit,
            onChange: (page) => fetchUsers(page),
            showTotal: (total) => `စုစုပေါင်း ${total} ယောက်`,
          }}
          locale={{ emptyText: 'User data မရှိသေးပါ' }} />
      </Card>

      <Modal
        title={modalMode === 'create' ? 'User အသစ်ထည့်မည်' : 'User ပြင်မည်'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="သိမ်းမည်"
        cancelText="မလုပ်တော့ပါ"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="အမည်" rules={[{ required: true, message: 'အမည်ထည့်ပါ' }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email ထည့်ပါ' }]}><Input /></Form.Item>
          {modalMode === 'create' && (
            <Form.Item name="password" label="Password"><Input.Password placeholder="မထည့်ရင် password123" /></Form.Item>
          )}
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Role ရွေးပါ' }]}>
            <Select options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'TEACHER', label: 'Teacher' }, { value: 'STUDENT', label: 'Student' }]} />
          </Form.Item>
          <Form.Item name="phone" label="ဖုန်း"><Input /></Form.Item>
          {modalMode === 'edit' && (
            <Form.Item name="isActive" label="အခြေအနေ">
              <Select options={[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}

