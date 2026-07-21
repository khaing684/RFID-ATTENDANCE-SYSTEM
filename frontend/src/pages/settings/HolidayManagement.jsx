import { useState, useEffect } from "react";
import {
  Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker,
  Popconfirm, Typography, Tag, Row, Col, message, Tooltip,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined,
  ThunderboltOutlined, ClearOutlined,
} from "@ant-design/icons";
import api from "../../config/api";
import dayjs from "dayjs";

const { Text } = Typography;

const HOLIDAY_TYPES = [
  { value: "NATIONAL", label: "Public holiday", color: "red" },
  { value: "SCHOOL", label: "School day", color: "orange" },
  { value: "EXAM", label: "Exam day", color: "purple" },
];

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [prePopLoading, setPrePopLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchHolidays = async (year) => {
    setLoading(true);
    try {
      const params = {};
      if (year) params.year = year;
      const { data } = await api.get("/holidays", { params });
      setHolidays(data.holidays || []);
    } catch {
      message.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays(yearFilter);
  }, [yearFilter]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        date: values.date.format("YYYY-MM-DD"),
        name: values.name,
        type: values.type,
        description: values.description || "",
      };

      if (editing) {
        await api.patch(`/holidays/${editing.id}`, payload);
        message.success("Holiday updated");
      } else {
        await api.post("/holidays", payload);
        message.success("Holiday added");
      }

      form.resetFields();
      setModalOpen(false);
      setEditing(null);
      fetchHolidays(yearFilter);
    } catch (err) {
      if (err.response) message.error(err.response.data?.message || "Error");
    }
  };

  const handlePrePopulate = async () => {
    setPrePopLoading(true);
    try {
      const year = yearFilter || String(new Date().getFullYear());
      const { data } = await api.post("/holidays/pre-populate", { year: Number(year) });
      message.success(data.message);
      fetchHolidays(yearFilter);
    } catch {
      message.error("Pre-populate failed");
    } finally {
      setPrePopLoading(false);
    }
  };

  const openModal = (record = null) => {
    setEditing(record);
    if (record) {
      form.setFieldsValue({
        date: dayjs(record.date),
        name: record.name,
        type: record.type,
        description: record.description,
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const getTypeTag = (type) => {
    const t = HOLIDAY_TYPES.find((h) => h.value === type);
    return t ? <Tag color={t.color}>{t.label}</Tag> : <Tag>{type}</Tag>;
  };

  const columns = [
    {
      title: "Date", dataIndex: "date", width: 130, align: "center",
      render: (v) => dayjs(v).format("DD-MM-YYYY"),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Weekly", key: "day", width: 100, align: "center",
      render: (_, r) => {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = days[new Date(r.date).getDay()];
        return <Tag>{dayName}</Tag>;
      },
    },
    { title: "Holiday", dataIndex: "name", width: 200 },
   {
      title: "Action", key: "action", width: 120, align: "center",
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm
            title="Are u sure delete?"
            onConfirm={async () => {
              await api.delete(`/holidays/${r.id}`);
              message.success("Deleted");
              fetchHolidays(yearFilter);
            }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined style={{ color: "#faad14" }} />
          <span>Holiday Calendar</span>
        </Space>
      }
      style={{ borderRadius: 12, marginTop: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}
      extra={
        <Space>
          <Select
            value={yearFilter}
            onChange={setYearFilter}
            style={{ width: 100 }}
            options={[{ value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) }]}
          />
          <Tooltip title="Auto-fill annual public holidays.">
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handlePrePopulate}
              loading={prePopLoading}
            >
              Pre-populate
            </Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Add Holiday
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={holidays}
        loading={loading}
        size="small"
        pagination={{ pageSize: 15 }}
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editing ? "Edit Holiday" : "Add Holiday"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Select date" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="name" label="Holiday Name" rules={[{ required: true, message: "Enter holiday name" }]}>
            <Input placeholder="e.g. အာဇာနည်နေ့" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={HOLIDAY_TYPES} placeholder="Select type" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional note" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
