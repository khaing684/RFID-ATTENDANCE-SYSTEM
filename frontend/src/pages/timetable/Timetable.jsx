import { useState, useEffect } from "react";
import {
  Card, Row, Col, Select, Button, Table, Tag, Modal, Form, Input, TimePicker,
  Typography, Space, message, Popconfirm, Empty,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, ClockCircleOutlined } from "@ant-design/icons";
import api from "../../config/api";
import dayjs from "dayjs";

const { Title } = Typography;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STORAGE_KEY = "timetable_selected_class";

export default function Timetable() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedClass, setSelectedClass] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [loading, setLoading] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [entryModal, setEntryModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [subjectForm] = Form.useForm();
  const [entryForm] = Form.useForm();

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.get("/classes"),
        api.get("/subjects"),
      ]);
      setClasses(cRes.data.classes || []);
      setSubjects(sRes.data.subjects || []);
    } catch { message.error("Failed to load data"); }
  };

  useEffect(() => {
    if (selectedClass) fetchTimetable();
    else setEntries([]);
  }, [selectedClass]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/timetable/${selectedClass}`);
      setEntries(data.entries || []);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  };

  const handleSubjectSubmit = async () => {
    try {
      const values = await subjectForm.validateFields();
      if (editing) {
        await api.patch(`/subjects/${editing.id}`, values);
        message.success("Subject updated");
      } else {
        await api.post("/subjects", values);
        message.success("Subject created");
      }
      subjectForm.resetFields();
      setSubjectModal(false);
      setEditing(null);
      fetchInitial();
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };

  const handleEntrySubmit = async () => {
    try {
      const values = await entryForm.validateFields();
      const payload = {
        classId: selectedClass,
        subjectId: values.subjectId,
        dayOfWeek: values.dayOfWeek,
        startTime: values.timeRange[0].format("HH:mm"),
        endTime: values.timeRange[1].format("HH:mm"),
      };
      let res;
      if (editing) {
        res = await api.patch(`/timetable/${editing.id}`, payload);
        message.success("Timetable updated");
      } else {
        res = await api.post("/timetable", payload);
        message.success("Timetable entry added");
      }
      entryForm.resetFields();
      setEntryModal(false);
      setEditing(null);
      // Refresh timetable entries from API
      const classId = selectedClass;
      const { data } = await api.get(`/timetable/${classId}`);
      setEntries(data.entries || []);
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };

  const openEntryModal = (record = null) => {
    setEditing(record);
    if (record) {
      entryForm.setFieldsValue({
        subjectId: record.subjectId,
        dayOfWeek: record.dayOfWeek,
        timeRange: [dayjs(record.startTime, "HH:mm"), dayjs(record.endTime, "HH:mm")],
      });
    } else {
      entryForm.resetFields();
    }
    setEntryModal(true);
  };

  const timeSlots = [...new Set(entries.map((e) => `${e.startTime}-${e.endTime}`))].sort();
  const timeSlotLabels = timeSlots.map((slot) => {
    const [s, e] = slot.split("-");
    return { key: slot, label: `${s} - ${e}` };
  });

  const getEntry = (dayIdx, timeKey) => {
    const [start, end] = timeKey.split("-");
    return entries.find((e) => e.dayOfWeek === dayIdx && e.startTime === start && e.endTime === end);
  };

  const gridColumns = [
    { title: "Time", dataIndex: "label", key: "time", width: 130, fixed: "left" },
    ...DAYS.map((day, idx) => ({
      title: day,
      key: `day-${idx}`,
      align: "center",
      render: (_, timeSlot) => {
        const entry = getEntry(idx, timeSlot.key);
        if (!entry) return <Tag style={{ borderStyle: "dashed", opacity: 0.5 }}>—</Tag>;
        return (
          <div style={{ cursor: "pointer" }} onClick={() => openEntryModal(entry)}>
            <Tag color={entry.subject?.color || "#1677ff"} style={{ fontWeight: 500, padding: "2px 8px" }}>
              {entry.subject?.name || entry.subject?.code}
            </Tag>
          </div>
        );
      },
    })),
  ];

  const subjectColumns = [
    { title: "Code", dataIndex: "code", width: 100, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: "Subject", dataIndex: "name", width: 150 },
    { title: "Color", dataIndex: "color", width: 80, render: (v) => <Tag color={v}>{v}</Tag> },
    {
      title: "Action", key: "action", width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(r); subjectForm.setFieldsValue(r); setSubjectModal(true); }} />
          <Popconfirm title="Delete?" onConfirm={async () => { await api.delete(`/subjects/${r.id}`); fetchInitial(); message.success("Deleted"); }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title={<Space><BookOutlined /> Subjects</Space>} style={{ marginBottom: 16, borderRadius: 12 }}>
        <Row justify="end" style={{ marginBottom: 12 }}>
          <Col>
            <Button type="primary" icon={<PlusOutlined />}
              onClick={() => { setEditing(null); subjectForm.resetFields(); setSubjectModal(true); }}>
              Add Subject
            </Button>
          </Col>
        </Row>
        <Table rowKey="id" columns={subjectColumns} dataSource={subjects} size="small" pagination={false} />
      </Card>

      <Card title={<Space><ClockCircleOutlined /> Timetable</Space>} style={{ borderRadius: 12 }}
        extra={
          <Space>
            <Select placeholder="Select Class" style={{ width: 250 }}
              value={selectedClass}
              onChange={(val) => {
                setSelectedClass(val);
                if (val) localStorage.setItem(STORAGE_KEY, val);
                else localStorage.removeItem(STORAGE_KEY);
              }}
              options={classes.map((c) => ({ value: c.id, label: `${c.grade?.name} (${c.grade?.type}) - ${c.name}` }))} />
            {selectedClass && (
              <Button icon={<PlusOutlined />} onClick={() => openEntryModal()}>Add Entry</Button>
            )}
          </Space>
        }>
        {!selectedClass ? (
          <Empty description="Please select a class to view timetable" />
        ) : (
          <Table rowKey="key" columns={gridColumns} dataSource={timeSlotLabels}
            loading={loading} size="small" pagination={false} scroll={{ x: 900 }} bordered />
        )}
      </Card>

      <Modal title={editing ? "Edit Subject" : "Add Subject"} open={subjectModal}
        onOk={handleSubjectSubmit}
        onCancel={() => { setSubjectModal(false); setEditing(null); }} okText="Save" destroyOnClose>
        <Form form={subjectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input placeholder="e.g. MYA" />
          </Form.Item>
          <Form.Item name="name" label="Subject Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. မြန်မာ" />
          </Form.Item>
          <Form.Item name="color" label="Tag Color">
            <Select options={[
              { value: "#1677ff", label: <Tag color="#1677ff">Blue</Tag> },
              { value: "#52c41a", label: <Tag color="#52c41a">Green</Tag> },
              { value: "#faad14", label: <Tag color="#faad14">Yellow</Tag> },
              { value: "#ff4d4f", label: <Tag color="#ff4d4f">Red</Tag> },
              { value: "#722ed1", label: <Tag color="#722ed1">Purple</Tag> },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={editing ? "Edit Entry" : "Add Timetable Entry"} open={entryModal}
        onOk={handleEntrySubmit}
        onCancel={() => { setEntryModal(false); setEditing(null); }} okText="Save" destroyOnClose>
        <Form form={entryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="subjectId" label="Subject" rules={[{ required: true }]}>
            <Select placeholder="Select Subject"
              options={subjects.map((s) => ({ value: s.id, label: <Space><Tag color={s.color}>{s.code}</Tag> {s.name}</Space> }))} />
          </Form.Item>
          <Form.Item name="dayOfWeek" label="Day" rules={[{ required: true }]}>
            <Select placeholder="Select Day" options={DAYS.map((d, i) => ({ value: i, label: d }))} />
          </Form.Item>
          <Form.Item name="timeRange" label="Time Range" rules={[{ required: true }]}>
            <TimePicker.RangePicker format="HH:mm" minuteStep={5} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}