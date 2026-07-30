import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Popconfirm,
  Typography,
  Card,
  Row,
  Col,
  message,
  Tooltip,
  Badge,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserSwitchOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import api from "../../config/api";

const { Title } = Typography;

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    tagType: "",
    search: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingTag, setEditingTag] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTagId, setAssignTagId] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  const fetchTags = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: pagination.limit };
        if (filters.status) params.status = filters.status;
        if (filters.tagType) params.tagType = filters.tagType;
        if (filters.search) params.search = filters.search;
        const { data } = await api.get("/tags", { params });
        setTags(data.tags);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      } catch {
        message.error("Can't tags");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit],
  );

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleOpenModal = (mode, record = null) => {
    setModalMode(mode);
    setEditingTag(record);
    if (record)
      form.setFieldsValue({
        rfidCode: record.rfidCode,
        tagType: record.tagType,
        description: record.description,
        status: record.status,
      });
    else form.resetFields();
    if (mode === "edit") fetchUsers();
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingTag(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === "create") {
        await api.post("/tags", values);
        message.success("Create successfully");
      } else {
        await api.patch(`/tags/${editingTag.id}`, values);
        message.success("Edit successfully");
      }
      handleClose();
      fetchTags(pagination.page);
    } catch (err) {
      if (err.response)
        message.error(err.response.data?.message || "connection error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tags/${id}`);
      message.success("Delete successfully");
      fetchTags(pagination.page);
    } catch {
      message.error("Delete Failed");
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get("/users", { params: { limit: 1000 } });
      setUsers(data.users || []);
    } catch {
      message.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleOpenAssign = (record) => {
    setAssignTagId(record.id);
    assignForm.setFieldsValue({ userId: record.assignedTo?.id || "" });
    fetchUsers();
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    try {
      const { userId } = await assignForm.validateFields();
      if (userId) {
        await api.patch(`/tags/${assignTagId}/assign`, { userId });
        message.success("Assign Successfully");
      } else {
        await api.patch(`/tags/${assignTagId}/unassign`);
        message.success("Unassign Successfully");
      }
      setAssignOpen(false);
      fetchTags(pagination.page);
    } catch (err) {
      message.error(err.response?.data?.message || "No more Page");
    }
  };

  const statusMap = {
    ACTIVE: { color: "green", text: "Active" },
    INACTIVE: { color: "default", text: "Inactive" },
    LOST: { color: "red", text: "Lost" },
    DAMAGED: { color: "orange", text: "Damage" },
  };
  const roleColorMap = {
    ADMIN: "#660708",
    TEACHER: "#89023e",
    STUDENT: "#004b23",
  };

  const roleLabelMap = {
    ADMIN: "Admin",
    TEACHER: "Teacher",
    STUDENT: "Student",
  };
  const columns = [
    {
      title: "RFID Code",
      dataIndex: "rfidCode",
      align: "center",
      width: 150,
      render: (t) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "tagType",
      align: "center",
      width: 100,
      render: (v) => <Tag>{v === "ACTIVE" ? "Active" : "Passive"}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      width: 110,
      render: (v) => (
        <Badge
          status={
            v === "ACTIVE" ? "success" : v === "LOST" ? "error" : "default"
          }
          text={statusMap[v]?.text || v}
        />
      ),
    },
 
    {
      title: "Assigned User",
      key: "assignedUser",
      align: "center",
      width: 180,
      render: (_, r) =>
        r.assignedTo ? (
          <span>
            {r.assignedTo.name}{" "}
            <span style={{ color: roleColorMap[r.assignedTo.role], fontWeight: 500 }}>
              ({roleLabelMap[r.assignedTo.role]})
            </span>
          </span>
        ) : (
          "—"
        ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      align: "center",
      width: 150,
      render: (v) => new Date(v).toLocaleString("en-US", { timeZone: "Asia/Yangon" })
    },
    {
      title: "Action",
      key: "actions",
      width: 170,
      align: "center",
      render: (_, r) => (
        <Space>
          <Button
            size="medium"
            icon={<UserSwitchOutlined />}
            onClick={() => handleOpenAssign(r)}
            >
             Assign 
            </Button>
          
          <Button
            size="medium"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal("edit", r)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are u sure delete？"
            onConfirm={() => handleDelete(r.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="medium" danger icon={<DeleteOutlined />}
             >
              Delete
              </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ padding : "12px 6px"}}>
        <Col>
          <Space wrap>
            <Input placeholder="Search by RFID Code" prefix={<SearchOutlined />} allowClear style={{ width: 200 }} value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
            <Select placeholder="Type" allowClear style={{ width: 130 }} value={filters.tagType || undefined} onChange={(v) => setFilters((f) => ({ ...f, tagType: v || "" }))} options={[{ value: "ACTIVE", label: "Active" }, { value: "PASSIVE", label: "Passive" }]} />
            <Select placeholder="Status" allowClear style={{ width: 130 }} value={filters.status || undefined} onChange={(v) => setFilters((f) => ({ ...f, status: v || "" }))} options={[{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }, { value: "LOST", label: "Lost" }, { value: "DAMAGED", label: "Damage" }]} />
            <Button icon={<ClearOutlined />} onClick={() => setFilters({ status: "", tagType: "", search: "" })}> Clear </Button>
          </Space>
        </Col>
        <Col>
          <Button type="primary"  style={{ marginRight: "2px" }} icon={<PlusOutlined />} onClick={() => handleOpenModal("create")}>
            Create New Tag
          </Button>
        </Col>
      </Row>

      
      <Table
        bordered
        rowKey="id"
        columns={columns}
        dataSource={tags}
        loading={loading}
        scroll={{ x: 1000 }}
        size="small"
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (t) => `Total (${t})`,
          onChange: (p, s) =>
            setPagination((prev) => ({ ...prev, page: p, limit: s })),
        }}
        style={{ padding: "2px 8px"}}
      />
    

      <Modal
        title={modalMode === "create" ? "Create Form" : "Edit Form"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={handleClose}
        okText={modalMode === "create" ? "create" : "update"}
        cancelText="cancel"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="rfidCode"
            label="RFID Code"
            rules={[{ required: true, message: "Please enter RFID Code" }]}
          >
            <Input placeholder="Eg- RF-001" />
          </Form.Item>
          <Form.Item name="tagType" label="Type" initialValue="PASSIVE">
            <Select
              options={[
                { value: "PASSIVE", label: "Passive" },
                { value: "ACTIVE", label: "Active" },
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="ACTIVE">
            <Select
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "LOST", label: "Lost" },
                { value: "DAMAGED", label: "Damage" },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="Note">
            <Input.TextArea rows={2} placeholder="Note...." />
          </Form.Item>

          {editingTag && (
            <Form.Item label="Assigned User">
              {editingTag.assignedTo ? (
                <Tag
                  color={roleColorMap[editingTag.assignedTo.role]}
                  style={{ fontSize: 14, padding: "4px 12px" }}
                >
                  {editingTag.assignedTo.name} ({roleLabelMap[editingTag.assignedTo.role]})
                </Tag>
              ) : (
                <Typography.Text type="secondary">— None —</Typography.Text>
              )}
            </Form.Item>
          )}
        </Form>
      </Modal>
      <Modal
        title="Tag Assign"
        open={assignOpen}
        onOk={handleAssign}
        onCancel={() => setAssignOpen(false)}
        okText="confirm"
        cancelText="cancel"
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="userId" label="Assign to User">
            <Select
              allowClear
              showSearch
              loading={usersLoading}
              placeholder="Search & select a user..."
              filterOption={(input, option) =>
                option.label?.toLowerCase().includes(input.toLowerCase())
              }
              options={users.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.email})`,
              }))}
              notFoundContent={usersLoading ? "Loading..." : "No users found"}
            />
          </Form.Item>
        </Form>
      </Modal>
     
    </>
  );
}
