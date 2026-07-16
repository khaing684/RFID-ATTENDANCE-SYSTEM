import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, Select, Modal, Form, Typography, Card, Row, Col, message, Popconfirm, Input } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../config/api';

const { Title } = Typography;

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (filters.role) params.role = filters.role;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get('/tags', { params });
      setUsers([]);
      message.info('Users API မရှိသေးပါ။ /api/users route ကို backend မှာ uncomment လုပ်ပါ');
    } catch {
      message.info('Users API မရှိသေးပါ။ server.js မှာ // app.use("/api/users", require("./routes/users")) ကို uncomment လုပ်ပါ');
    } finally { setLoading(false); }
  }, [filters, pagination.limit]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const roleMap = { ADMIN: { color: 'red', text: 'Admin' }, TEACHER: { color: 'blue', text: 'Teacher' }, STUDENT: { color: 'green', text: 'Student' } };

  const columns = [
    { title: 'အမည်', dataIndex: 'name', width: 150 },
    { title: 'Email', dataIndex: 'email', width: 200 },
    { title: 'Role', dataIndex: 'role', width: 100, render: (v) => <Tag color={roleMap[v]?.color}>{roleMap[v]?.text || v}</Tag> },
    { title: 'ဖုန်း', dataIndex: 'phone', width: 130, render: (v) => v || '-' },
    { title: 'အခြေအနေ', dataIndex: 'isActive', width: 100, render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag> },
    { title: 'ရက်စွဲ', dataIndex: 'createdAt', width: 130, render: (v) => new Date(v).toLocaleDateString('my-MM') },
    { title: '', key: 'actions', width: 120, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingUser(r); form.setFieldsValue({ name: r.name, email: r.email, role: r.role, phone: r.phone }); setModalOpen(true); }} />
        <Popconfirm title="ဖျက်မှာသေချာလား？" okText="ဖျက်မည်" cancelText="မဖျက်ပါ">
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  const handleSubmit = async () => {
    message.info('Users API မရှိသေးပါ။ နောက်မှ ဆက်လုပ်ပါမည်');
    setModalOpen(false);
  };

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col><Title level={4} style={{ margin: 0 }}>User များ</Title></Col>
          <Col>
            <Space>
              <Tag color="orange">⚠️ Users API မရှိသေးပါ</Tag>
              <Button type="primary" icon={<PlusOutlined />}>User အသစ်</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col><Input placeholder="အမည်/Email ရှာ..." prefix={<SearchOutlined />} allowClear style={{ width: 220 }} value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} /></Col>
          <Col><Select placeholder="Role" allowClear style={{ width: 130 }} value={filters.role || undefined} onChange={(v) => setFilters((f) => ({ ...f, role: v || '' }))} options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'TEACHER', label: 'Teacher' }, { value: 'STUDENT', label: 'Student' }]} /></Col>
          <Col><Button icon={<ReloadOutlined />} onClick={() => setFilters({ role: '', search: '' })}>ပြန်စမည်</Button></Col>
        </Row>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={users} loading={loading} scroll={{ x: 900 }}
          pagination={false}
          locale={{ emptyText: 'Users API route (/api/users) ကို backend server.js မှာ uncomment လုပ်ပြီးမှ ဒေတာတွေ ပေါ်လာပါမည်' }} />
      </Card>

      <Modal title="User ပြင်မည်" open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText="သိမ်းမည်" cancelText="မလုပ်တော့ပါ" destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="အမည်" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="Role"><Select options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'TEACHER', label: 'Teacher' }, { value: 'STUDENT', label: 'Student' }]} /></Form.Item>
          <Form.Item name="phone" label="ဖုန်း"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
