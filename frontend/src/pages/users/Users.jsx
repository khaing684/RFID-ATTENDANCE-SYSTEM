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
  Descriptions,
  Badge,
  DatePicker,
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
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../config/api";

const { Title, Text } = Typography;

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

  // Detail Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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
    try {
      const { data } = await api.get("/classes");
      setClasses(data.classes || []);
    } catch {}
  };

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
    ADMIN: { color: "volcano", text: "Admin" },
    TEACHER: { color: "purple", text: "Teacher" },
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
        dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
        parentName: record.parentName,
        address: record.address,
        classId: record.classId || undefined,
        isActive: record.isActive,
      });
      setAvatarPreview(record.avatar || null);
    } else {
      form.resetFields();
      setAvatarPreview(null);
    }
    setModalOpen(true);
  };

  const handleOpenDetail = (record) => {
    setSelectedUser(record);
    setDetailOpen(true);
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
      // Convert dayjs dateOfBirth to string
      if (values.dateOfBirth && dayjs.isDayjs(values.dateOfBirth)) {
        values.dateOfBirth = values.dateOfBirth.format("YYYY-MM-DD");
      }
      if (avatarFile) {
        values.avatar = await getBase64(avatarFile);
      } else if (modalMode === "edit") {
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

  // -- Get class/section name from classId --
  const getSectionName = (classId) => {
    if (!classId) return "-";
    const cls = classes.find((c) => c.id === classId);
    return cls ? `${cls.grade?.name || ""} - ${cls.name}`.trim() : "-";
  };

  // -- Essential Columns (Table) --
  const columns = [
    {
      title: "NAME",
      dataIndex: "name",
      width: 180,
      render: (name, record) => (
        <Space size={10}>
          <Avatar
            size={36}
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          >
            {name ? name.charAt(0).toUpperCase() : "U"}
          </Avatar>
          <Text strong>{name || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "EMAIL",
      dataIndex: "email",
      width: 200,
    },
    {
      title: "ROLE",
      dataIndex: "role",
      width: 100,
      align: "center",
      render: (v) => (
        <Tag color={roleMap[v]?.color || "default"}>{roleMap[v]?.text || v}</Tag>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "isActive",
      width: 100,
      align: "center",
      render: (v) => (
        <Badge status={v ? "success" : "error"} text={v ? "Active" : "Inactive"} />
      ),
    },
    {
      title: "ACTION",
      key: "actions",
      align: "center",
      width: 220,
      render: (_, r) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetail(r)}
          >
            Detail
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal("edit", r)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are u sure delete?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(r.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space wrap>
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

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        size="middle"
        pagination={{
          current: pagination.page,
          total: pagination.total,
          pageSize: pagination.limit,
          onChange: (page) => fetchUsers(page),
          showTotal: (total) => `total (${total})`,
        }}
        locale={{ emptyText: "No User Data" }}
      />

      {/* Detail Modal */}
      <Modal
        title={
          <Text strong style={{ fontSize: 18 }}>
            User Account Details
          </Text>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        }
        centered
        width={500}
        destroyOnClose
      >
        {selectedUser && (
          <div style={{ paddingTop: 16 }}>
            {/* Avatar + Name + Role */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Avatar
                size={80}
                src={selectedUser.avatar}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#1890ff", marginBottom: 12 }}
              >
                {selectedUser.name
                  ? selectedUser.name.charAt(0).toUpperCase()
                  : "U"}
              </Avatar>
              <Title level={4} style={{ margin: 0 }}>
                {selectedUser.name}
              </Title>
              <Tag
                color={roleMap[selectedUser.role]?.color || "default"}
                style={{ marginTop: 6, borderRadius: 12, fontWeight: 600 }}
              >
                {roleMap[selectedUser.role]?.text || selectedUser.role}
              </Tag>
            </div>

            {/* Detail Info */}
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Email">
                {selectedUser.email || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedUser.phone || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {selectedUser.dateOfBirth
                  ? dayjs(selectedUser.dateOfBirth).format("DD MMM YYYY")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Parent Name">
                {selectedUser.parentName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {selectedUser.address || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Section">
                {getSectionName(selectedUser.classId)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge
                  status={selectedUser.isActive ? "success" : "error"}
                  text={selectedUser.isActive ? "Active Account" : "Inactive / Suspended"}
                />
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
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
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          {/* Avatar */}
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
              <Button icon={<UploadOutlined />} size="middle">
                Choose Avatar
              </Button>
            </Upload>
          </div>

          {/* Row 1: Name + Email */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[
                  { required: true, message: "Please enter full name" },
                  { min: 2, message: "Name must be at least 2 characters" },
                  { max: 50, message: "Name must not exceed 50 characters" },
                  { pattern: /^[a-zA-Z\s]+$/, message: "Name can only contain letters and spaces" },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="John Doe"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: "Please enter email address" },
                  { type: "email", message: "Please enter a valid email address" },
                ]}
                validateTrigger="onBlur"
              >
                <Input
                  prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="example@mail.com"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: Role + Section */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="User Role"
                rules={[{ required: true, message: "Please select a user role" }]}
              >
                <Select
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
              <Form.Item name="classId" label="Section">
                <Select
                  allowClear
                  placeholder="Select Section"
                  options={classes.map((c) => ({
                    value: c.id,
                    label: `${c.grade?.name || ""} - ${c.name}`.trim(),
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 3: Phone + Date of Birth */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { pattern: /^[0-9+\-\s()]{7,15}$/, message: "Please enter a valid phone number" },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="09xxxxxxxxx"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dateOfBirth" label="Date of Birth">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Select date of birth"
                  defaultPickerValue={dayjs("2005-01-01")}
                  disabledDate={(current) => {
                    const start = dayjs("2005-01-01");
                    const end = dayjs().endOf("year");
                    return current && (current.isBefore(start, "day") || current.isAfter(end, "day"));
                  }}
                  format={[
                    "DD/MMM/YYYY",
                    "DD-MM-YYYY",
                    "YYYY-MM-DD",
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 4: Parent Name + Address */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="parentName"
                label="Parent Name"
                rules={[
                  { min: 2, message: "Parent name must be at least 2 characters" },
                  { max: 50, message: "Parent name must not exceed 50 characters" },
                ]}
              >
                <Input placeholder="Parent / Guardian name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="address"
                label="Address"
                rules={[
                  { max: 200, message: "Address must not exceed 200 characters" },
                ]}
              >
                <Input placeholder="Home address" />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 5: Password / Status */}
          <Row gutter={16}>
            {modalMode === "create" ? (
              <Col span={24}>
                <Form.Item
                  name="password"
                  label="Account Password"
                  rules={[
                    { min: 6, message: "Password must be at least 6 characters" },
                    { max: 30, message: "Password must not exceed 30 characters" },
                  ]}
                >
                  <Input.Password placeholder="Minimum 6 characters recommended" />
                </Form.Item>
              </Col>
            ) : (
              <Col span={24}>
                <Form.Item name="isActive" label="Account Status">
                  <Select
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
    </div>
  );
}


