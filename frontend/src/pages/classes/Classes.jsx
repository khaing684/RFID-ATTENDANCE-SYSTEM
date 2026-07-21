import { useState, useEffect } from "react";
import { Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Typography, Card, Row, Col, message, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from "@ant-design/icons";
import api from "../../config/api";

const { Title } = Typography;

export default function Classes() {
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [gradeForm] = Form.useForm();
  const [classForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, cRes, tRes] = await Promise.all([
        api.get("/grades"),
        api.get("/classes"),
        api.get("/users?role=TEACHER&limit=100"),
      ]);
      setGrades(gRes.data.grades || []);
      setClasses(cRes.data.classes || []);
      setTeachers(tRes.data.users || []);
    } catch { message.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Grade Handlers ───
  const handleGradeSubmit = async () => {
    try {
      const values = await gradeForm.validateFields();
      if (editing) {
        await api.patch(`/grades/${editing.id}`, values);
        message.success("Grade updated");
      } else {
        await api.post("/grades", values);
        message.success("Grade created");
      }
      gradeForm.resetFields();
      setGradeModal(false);
      setEditing(null);
      fetchData();
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };

  // ─── Class Handlers ───
  const handleClassSubmit = async () => {
    try {
      const values = await classForm.validateFields();
      if (editing) {
        await api.patch(`/classes/${editing.id}`, values);
        message.success("Class updated");
      } else {
        await api.post("/classes", values);
        message.success("Class created");
      }
      classForm.resetFields();
      setClassModal(false);
      setEditing(null);
      fetchData();
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };

  const openClassModal = (record = null) => {
    setEditing(record);
    if (record) {
      classForm.setFieldsValue({
        name: record.name,
        gradeId: record.gradeId,
        teacherId: record.teacherId || undefined,
      });
    } else {
      classForm.resetFields();
    }
    setClassModal(true);
  };

  // ─── Columns ───
  const classColumns = [
    { title: "Grade", key: "grade", render: (_, r) => `${r.grade?.name} (${r.grade?.type})`, width: 200 },
    { title: "Section", dataIndex: "name", width: 150 },
    { title: "Class Teacher", key: "teacher", render: (_, r) => r.teacher?.name || <Tag color="orange">Not Assigned</Tag>, width: 200 },
    { title: "Students", key: "students", render: (_, r) => <Tag color="blue">{r._count?.students || 0}</Tag>, width: 100 },
    {
      title: "Action", key: "action", width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openClassModal(r)} />
          <Popconfirm title="Delete?" onConfirm={async () => { await api.delete(`/classes/${r.id}`); fetchData(); message.success("Deleted"); }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const gradeColumns = [
    { title: "Grade", dataIndex: "name", width: 150 },
    { title: "Type", dataIndex: "type", render: (v) => <Tag color={v === "ONLINE" ? "blue" : "green"}>{v}</Tag>, width: 100 },
    { title: "Level", dataIndex: "level", width: 80 },
    { title: "Classes", key: "classes", render: (_, r) => <Tag color="blue">{r._count?.classes || 0}</Tag>, width: 80 },
    {
      title: "Action", key: "action", width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); gradeForm.setFieldsValue(r); setGradeModal(true); }} />
          <Popconfirm title="Delete?" onConfirm={async () => { await api.delete(`/grades/${r.id}`); fetchData(); message.success("Deleted"); }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* ─── Grades Section ─── */}
      <Card title={<Space><TeamOutlined /> Grades Management</Space>} style={{ marginBottom: 16 }}>
        <Row justify="end" style={{ marginBottom: 12 }}>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); gradeForm.resetFields(); setGradeModal(true); }}>Add Grade</Button></Col>
        </Row>
        <Table rowKey="id" columns={gradeColumns} dataSource={grades} loading={loading} size="small" pagination={false} />
      </Card>

      {/* ─── Classes Section ─── */}
      <Card title={<Space><TeamOutlined /> Classes / Sections</Space>}>
        <Row justify="end" style={{ marginBottom: 12 }}>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => openClassModal()}>Add Class</Button></Col>
        </Row>
        <Table rowKey="id" columns={classColumns} dataSource={classes} loading={loading} size="small" pagination={false} />
      </Card>
      

      {/* ─── Grade Modal ─── */}
      <Modal title={editing ? "Edit Grade" : "Add Grade"} open={gradeModal} onOk={handleGradeSubmit} onCancel={() => { setGradeModal(false); setEditing(null); }} okText="Save" destroyOnClose>
        <Form form={gradeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Grade Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Grade-10" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
          <Input placeholder="e.g. Myanmar" />
          </Form.Item>
          <Form.Item name="level" label="Level (sorting)">
            <Input type="number" placeholder="e.g. 10" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Class Modal ─── */}
      <Modal title={editing ? "Edit Class" : "Add Class"} open={classModal} onOk={handleClassSubmit} onCancel={() => { setClassModal(false); setEditing(null); }} okText="Save" destroyOnClose>
        <Form form={classForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="gradeId" label="Grade" rules={[{ required: true }]}>
            <Select options={grades.map((g) => ({ value: g.id, label: `${g.name} (${g.type})` }))} placeholder="Select Grade" />
          </Form.Item>
          <Form.Item name="name" label="Section Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Section-A" />
          </Form.Item>
          <Form.Item name="teacherId" label="Class Teacher">
            <Select allowClear placeholder="Select Teacher" options={teachers.map((t) => ({ value: t.id, label: t.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}