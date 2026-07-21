import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Modal,
  Form,
  Typography,
  Card,
  Row,
  Col,
  message,
  Popconfirm,
  Input,
  Upload,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ClearOutlined,
  UploadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import api from "../../config/api";

const { Title } = Typography;

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({ role: "", search: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingUser, setEditingUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [form] = Form.useForm();
  const [classes, setClasses] = useState([]);

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const fetchClasses = async () => {
    try{
      const { data } = await api.get("/classes");
      setClasses(data.classes || []);

    }catch {

    }
  }    

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: pagination.limit };
        if (filters.role) params.role = filters.role;
        if (filters.search) params.search = filters.search;
        const { data } = await api.get("/users", { params });
        setUsers(data.users);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      } catch {
        message.error("No User Data ");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit],
  );

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, [fetchUsers]);

  const roleMap = {
    ADMIN: { color: "red", text: "Admin" },
    TEACHER: { color: "blue", text: "Teacher" },
    STUDENT: { color: "green", text: "Student" },
  };

  const handleOpenModal = (mode, record = null) => {
    setModalMode(mode);
    setEditingUser(record);
    setAvatarFile(null);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        email: record.email,
        role: record.role,
        phone: record.phone,
        isActive: record.isActive,
      });
      setAvatarPreview(record.avatar || null);
    } else {
      form.resetFields();
      setAvatarPreview(null);
    }
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success("Delete User Successfully");
      fetchUsers();
    } catch {
      message.error("Delete Failed");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (avatarFile) {
        values.avatar = await getBase64(avatarFile);
      } else if (modalMode === "edit") {
        // Edit mode: keep existing avatar if no new file selected
        if (avatarPreview) values.avatar = avatarPreview;
        else values.avatar = null;
      }
      if (modalMode === "create") {
        await api.post("/users", values);
        message.success("Create User Successfully");
      } else {
        await api.patch(`/users/${editingUser.id}`, values);
        message.success("Update User Successfully");
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      if (err.response) message.error(err.response.data?.message || "Error");
    }
  };

  const handleBeforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Image file only!");
      return Upload.LIST_IGNORE;
    }
    const isLt2MB = file.size / 1024 / 1024 < 2;
    if (!isLt2MB) {
      message.error("Image must be smaller than 2MB!");
      return Upload.LIST_IGNORE;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    return false;
  };

  const columns = [
    { title: "Name", dataIndex: "name", width: 150, align: "center" },
    { title: "Email", dataIndex: "email", width: 200, align: "center" },
    {
      title: "Role",
      dataIndex: "role",
      width: 100,
      align: "center",
      render: (v) => (
        <Tag color={roleMap[v]?.color}>{roleMap[v]?.text || v}</Tag>
      ),
    },
    { title: "Phone", dataIndex: "phone", width: 130, render: (v) => v || "-" },
    {
      title: "Status",
      dataIndex: "isActive",
      width: 100,
      align: "center",
      render: (v) => (
        <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      align: "center",
      width: 140,
      render: (v) => new Date(v).toLocaleString("en-US"),
    },
    {
      title: "Action",
      key: "actions",
      align: "center",
      width: 120,
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal("edit", r)}
          >
            {" "}
            Edit
          </Button>
          <Popconfirm
            title="Are u sure delete?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(r.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              {" "}
              Delete{" "}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ padding: "12px 12px" }}
      >
        <Col>
          <Space>
            <Input
              placeholder="Search by Name/Email"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 220 }}
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
            <Select
              placeholder="Role"
              allowClear
              style={{ width: 130 }}
              value={filters.role || undefined}
              onChange={(v) => setFilters((f) => ({ ...f, role: v || "" }))}
              options={[
                { value: "ADMIN", label: "Admin" },
                { value: "TEACHER", label: "Teacher" },
                { value: "STUDENT", label: "Student" },
              ]}
            />
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setFilters({ role: "", search: "" });
                fetchUsers(1);
              }}
            >
              Clear
            </Button>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal("create")}
          >
            Create New User
          </Button>
        </Col>
      </Row>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        size="small"
        pagination={{
          current: pagination.page,
          total: pagination.total,
          pageSize: pagination.limit,
          onChange: (page) => fetchUsers(page),
          showTotal: (total) => `total (${total})`,
        }}
        locale={{ emptyText: "No User Data" }}
        style={{ padding: "4px 10px" }}
      />

      {/* Modern Pop-up Modal Form */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            {modalMode === "create" ? "Add New User" : "Update User Account"}
          </Title>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={modalMode === "create" ? "Save User" : "Save Changes"}
        cancelText="Cancel"
        destroyOnClose
        centered
        width={550} // ကတ်နှစ်ခု ဘေးယှဉ်ဖို့ အကျယ်ကို တိုးပေးထားပါတယ်
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          {/* Enhanced Avatar Upload Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 24,
              background: "#fdfdfd",
              padding: "16px",
              borderRadius: "8px",
              border: "1px dashed #f0f0f0",
            }}
          >
            <Avatar
              size={72}
              src={avatarPreview}
              icon={<UserOutlined />}
              style={{
                backgroundColor: "#1890ff",
                marginBottom: 12,
                boxShadow: "0 4px 12px rgba(24,144,255,0.2)",
              }}
            />
            <Upload
              showUploadList={false}
              beforeUpload={handleBeforeUpload}
              accept="image/*"
            >
              <Button
                icon={<UploadOutlined />}
                size="middle"
                style={{ borderRadius: "4px" }}
              >
                Choose Avatar
              </Button>
            </Upload>
          </div>

          {/* Grid Rows for Layout (ဘေးချင်းယှဉ်ပေးလိုက်လို့ အောက်ကို အရှည်ကြီး ဆင်းမသွားတော့ပါ) */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Please enter full name" }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                  placeholder="John Doe"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  {
                    required: true,
                    type: "email",
                    message: "Please enter a valid email",
                  },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                  placeholder="example@mail.com"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="User Role"
                rules={[{ required: true, message: "Please select user role" }]}
              >
                <Select
                  size="large"
                  placeholder="Select a role"
                  options={[
                    { value: "ADMIN", label: "Admin" },
                    { value: "TEACHER", label: "Teacher" },
                    { value: "STUDENT", label: "Student" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="classId" label="Class">
                <Select
                  allowClear
                  placeholder="Select Class"
                  options={classes.map((c) => ({
                    value: c.id,
                    label: `${c.grade?.name} - ${c.name}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input
                  prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
                  size="large"
                  placeholder="09xxxxxxxxx"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {modalMode === "create" ? (
              <Col span={24}>
                <Form.Item name="password" label="Account Password">
                  <Input.Password
                    size="large"
                    placeholder="Minimum 6 characters recommended"
                  />
                </Form.Item>
              </Col>
            ) : (
              <Col span={24}>
                <Form.Item name="isActive" label="Account Status">
                  <Select
                    size="large"
                    options={[
                      { value: true, label: "Active Account" },
                      { value: false, label: "Inactive / Suspended" },
                    ]}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
    </>
  );
}
