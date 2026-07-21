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
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import api from "../../config/api";

const { Title } = Typography;

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    deviceType: "",
    search: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingDevice, setEditingDevice] = useState(null);
  const [form] = Form.useForm();

  const fetchDevices = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: pagination.limit };
        if (filters.status) params.status = filters.status;
        if (filters.deviceType) params.deviceType = filters.deviceType;
        if (filters.search) params.search = filters.search;
        const { data } = await api.get("/devices", { params });
        setDevices(data.devices);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      } catch {
        message.error("NO Device ");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit],
  );

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleOpenModal = (mode, record = null) => {
    setModalMode(mode);
    setEditingDevice(record);
    if (record)
      form.setFieldsValue({
        name: record.name,
        deviceCode: record.deviceCode,
        deviceType: record.deviceType,
        location: record.location,
        ipAddress: record.ipAddress,
        firmwareVersion: record.firmwareVersion,
        status: record.status,
      });
    else form.resetFields();
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingDevice(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === "create") {
        await api.post("/devices", values);
        message.success("Create Device Successfully ");
      } else {
        await api.patch(`/devices/${editingDevice.id}`, values);
        message.success("Update Device Successfully");
      }
      handleClose();
      fetchDevices(pagination.page);
    } catch (err) {
      if (err.response)
        message.error(err.response.data?.message || "connection error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/devices/${id}`);
      message.success("Delete Successfully");
      fetchDevices(pagination.page);
    } catch {
      message.error("Delete Failed");
    }
  };

  const handleHeartbeat = async (id) => {
    try {
      await api.patch(`/devices/${id}/heartbeat`);
      message.success("Heartbeat ပို့ပြီး");
      fetchDevices(pagination.page);
    } catch {
      message.error("Heartbeat ပို့မရပါ");
    }
  };

  const statusMap = {
    ONLINE: { color: "green", text: "Online" },
    OFFLINE: { color: "red", text: "Offline" },
    MAINTENANCE: { color: "orange", text: "Maintenance" },
    ERROR: { color: "red", text: "Error" },
  };

  const columns = [
    { title: "Name", dataIndex: "name", align: "center",width: 150 },
    {
      title: "Code",
      dataIndex: "deviceCode",
      align: "center",
      width: 130,
      render: (t) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "deviceType",
      align: "center",
      width: 100,
      render: (v) => (
        <Tag>
          {v === "HANDHELD" ? "Handheld" : v === "FIXED" ? "Fixed" : "USB"}
        </Tag>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      align: "center",
      width: 120,
      render: (v) => v || "-",
    },
    {
      title: "IP",
      dataIndex: "ipAddress",
      align: "center",
      width: 140,
      render: (v) => (v ? <Tag>{v}</Tag> : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      width: 110,
      render: (v) => (
        <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag>
      ),
    },
    {
      title: "Scan Number",
      key: "scans",
      align: "center",
      width: 120,
      render: (_, r) => r._count?.scanLogs || 0,
    },
    {
      title: "Date",
      dataIndex: "lastSeenAt",
      align: "center",
      width: 130,
      render: (v) => (v ? new Date(v).toLocaleString("my-MM") : "မရှိ"),
    },
    {
      title: "Action",
      key: "actions",
      align: "center",
      width: 170,
      render: (_, r) => (
        <Space>
          <Tooltip title="Heartbeat">
            <Button
              size="medium"
              icon={<WifiOutlined />}
              onClick={() => handleHeartbeat(r.id)}
            > HeartBeat
              </Button>
          </Tooltip>
          <Button
            size="medium"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal("edit", r)}
          > Edit
            </Button>
          <Popconfirm
            title="Are u sure delete？"
            onConfirm={() => handleDelete(r.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="medium" danger icon={<DeleteOutlined />} > Delete </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ padding: "12px 6px" }}>
        <Col>
          <Space wrap>
            <Input placeholder="Search by Code" prefix={<SearchOutlined />} allowClear style={{ width: 200 }} value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
            <Select placeholder="State" allowClear style={{ width: 130 }} value={filters.deviceType || undefined} onChange={(v) => setFilters((f) => ({ ...f, deviceType: v || "" }))} options={[{ value: "HANDHELD", label: "Handheld" }, { value: "FIXED", label: "Fixed" }, { value: "USB", label: "USB" }]} />
            <Select placeholder="Status" allowClear style={{ width: 130 }} value={filters.status || undefined} onChange={(v) => setFilters((f) => ({ ...f, status: v || "" }))} options={[{ value: "ONLINE", label: "Online" }, { value: "OFFLINE", label: "Offline" }, { value: "MAINTENANCE", label: "Maintenance" }, { value: "ERROR", label: "Error" }]} />
            <Button icon={<ReloadOutlined />} onClick={() => setFilters({ status: "", deviceType: "", search: "" })}>Clear</Button>
          </Space>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal("create")}>
            Create New Device
          </Button>
        </Col>
      </Row>

        <Table
          bordered
          rowKey="id"
          columns={columns}
          dataSource={devices}
          loading={loading}
          scroll={{ x: 1100 }}
          size="small"
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (t) => `Total  (${t}) `,
            onChange: (p, s) =>
              setPagination((prev) => ({ ...prev, page: p, limit: s })),
          }}
          style={{padding: "12px 6px"}}
        />
     
      <Modal
        title={modalMode === "create" ? "Create Device Form" : "Update Device Form"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={handleClose}
        okText={modalMode === "create" ? "Create" : "Update"}
        cancelText="Cancel"
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Enter Name" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deviceCode"
                label="Device Code"
                rules={[{ required: true, message: "Enter Device Code" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="deviceType"
                label="Type"
                initialValue="HANDHELD"
              >
                <Select
                  options={[
                    { value: "HANDHELD", label: "Handheld" },
                    { value: "FIXED", label: "Fixed" },
                    { value: "USB", label: "USB" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" initialValue="OFFLINE">
                <Select
                  options={[
                    { value: "ONLINE", label: "Online" },
                    { value: "OFFLINE", label: "Offline" },
                    { value: "MAINTENANCE", label: "Maintenance" },
                    { value: "ERROR", label: "Error" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="Location">
                <Input placeholder="Eg- Hostel A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ipAddress" label="IP Address">
                <Input placeholder="192.168.1.1" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="firmwareVersion" label="Firmware Version">
            <Input placeholder="v1.0.0" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
