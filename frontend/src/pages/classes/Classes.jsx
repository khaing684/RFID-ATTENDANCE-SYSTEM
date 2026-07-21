import { useState, useEffect } from "react";
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber,
  Popconfirm, Typography, Card, Row, Col, message, Tag, Collapse, List, Avatar, Divider } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined,
  CalendarOutlined, UserOutlined, HomeOutlined } from "@ant-design/icons";
import api from "../../config/api";

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function Classes() {
  const [gradeLevels, setGradeLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [yearModal, setYearModal] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollSectionId, setEnrollSectionId] = useState(null);
  const [enrollments, setEnrollments] = useState([]);

  const [editing, setEditing] = useState(null);
  const [gradeForm] = Form.useForm();
  const [sectionForm] = Form.useForm();
  const [yearForm] = Form.useForm();
  const [enrollForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, sRes, yRes, tRes, stuRes] = await Promise.all([
        api.get("/grade-levels"),
        api.get("/sections"),
        api.get("/academic-years"),
        api.get("/users?role=TEACHER&limit=100"),
        api.get("/users?role=STUDENT&limit=500"),
      ]);
      setGradeLevels(gRes.data.gradeLevels || []);
      setSections(sRes.data.sections || []);
      setAcademicYears(yRes.data.academicYears || []);
      setTeachers(tRes.data.users || []);
      setStudents(stuRes.data.users || []);
    } catch { message.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Academic Year ───
  const handleYearSubmit = async () => {
    try {
      const values = await yearForm.validateFields();
      await api.post("/academic-years", values);
      message.success("Academic year created");
      yearForm.resetFields();
      setYearModal(false);
      fetchData();
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };

  // ─── Grade Level ───
  const handleGradeSubmit = async () => {
    try {
      const values = await gradeForm.validateFields();
      if (editing) {
        await api.patch(`/grade-levels/${editing.id}`, values);
        message.success("Grade updated");
      } else {
        await api.post("/grade-levels", values);
        message.success("Grade created");
      }
      gradeForm.resetFields();
      setGradeModal(false);
      setEditing(null);
      fetchData();
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };

  // ─── Section ───
  const handleSectionSubmit = async () => {
    try {
      const values = await sectionForm.validateFields();
      if (editing) {
        await api.patch(`/sections/${editing.id}`, values);
        message.success("Section updated");
      } else {
        await api.post("/sections", values);
        message.success("Section created");
      }
      sectionForm.resetFields();
      setSectionModal(false);
      setEditing(null);
      fetchData();
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };

  const openSectionModal = (record = null) => {
    setEditing(record);
    if (record) {
      sectionForm.setFieldsValue({
        name: record.name,
        gradeLevelId: record.gradeLevelId,
        teacherId: record.teacherId || undefined,
        room: record.room,
        capacity: record.capacity,
      });
    } else { sectionForm.resetFields(); }
    setSectionModal(true);
  };

  // ─── Enrollment ───
  const openEnrollModal = async (section) => {
    setEnrollSectionId(section.id);
    setEnrollModal(true);
    enrollForm.resetFields();
    // Fetch current enrollments
    try {
      const { data } = await api.get(`/enrollments/section/${section.id}`);
      setEnrollments(data.enrollments || []);
    } catch { setEnrollments([]); }
  };

  const handleEnrollSubmit = async () => {
    try {
      const values = await enrollForm.validateFields();
      const currentYear = academicYears.find((y) => y.isCurrent);
      if (!currentYear) {
        message.error("Please set a current academic year first!");
        return;
      }
      await api.post("/enrollments", {
        studentId: values.studentId,
        sectionId: enrollSectionId,
        academicYearId: currentYear.id,
      });
      message.success("Student enrolled");
      enrollForm.resetFields();
      // Refresh
      const { data } = await api.get(`/enrollments/section/${enrollSectionId}`);
      setEnrollments(data.enrollments || []);
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };

  // ─── Columns ───
  const gradeColumns = [
    { title: "Grade", dataIndex: "name", width: 150 },
    { title: "Level", dataIndex: "level", width: 80, align: "center" },
    { title: "Sections", key: "sections", render: (_, r) => <Tag color="blue">{r._count?.sections || 0}</Tag>, width: 80, align: "center" },
    {
      title: "Action", key: "action", width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(r); gradeForm.setFieldsValue(r); setGradeModal(true); }} />
          <Popconfirm title="Delete?" onConfirm={async () => { await api.delete(`/grade-levels/${r.id}`); fetchData(); message.success("Deleted"); }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const sectionColumns = [
    { title: "Grade", key: "grade", render: (_, r) => `${r.gradeLevel?.name}`, width: 120 },
    { title: "Section", dataIndex: "name", width: 120 },
    { title: "Room", dataIndex: "room", render: (v) => v || "-", width: 100 },
    { title: "Teacher", key: "teacher", render: (_, r) => r.teacher?.name || <Tag color="orange">Not Assigned</Tag>, width: 180 },
    { title: "Students", key: "students", render: (_, r) => <Tag color="blue">{r.studentCount || 0}/{r.capacity || 40}</Tag>, width: 100 },
    {
      title: "Action", key: "action", width: 180,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<UserOutlined />} onClick={() => openEnrollModal(r)}>Enroll</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openSectionModal(r)} />
          <Popconfirm title="Delete?" onConfirm={async () => { await api.delete(`/sections/${r.id}`); fetchData(); message.success("Deleted"); }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* ─── Academic Year ─── */}
      <Card title={<Space><CalendarOutlined /> Academic Year</Space>} style={{ marginBottom: 16 }}
        extra={<Button icon={<PlusOutlined />} onClick={() => { yearForm.resetFields(); setYearModal(true); }}>Add Year</Button>}>
        <Space wrap>
          {academicYears.map((y) => (
            <Tag key={y.id} color={y.isCurrent ? "blue" : "default"}
              style={{ cursor: "pointer", padding: "4px 12px", fontSize: 14 }}
              onClick={async () => {
                await api.patch(`/academic-years/${y.id}/set-current`);
                fetchData();
                message.success(`${y.year} set as current`);
              }}>
              {y.year} {y.isCurrent ? "⭐" : ""}
            </Tag>
          ))}
          {academicYears.length === 0 && <Text type="secondary">No academic years yet</Text>}
        </Space>
      </Card>

      {/* ─── Grade Levels ─── */}
      <Card title={<Space><TeamOutlined /> Grade Levels</Space>} style={{ marginBottom: 16 }}>
        <Row justify="end" style={{ marginBottom: 12 }}>
          <Col><Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); gradeForm.resetFields(); setGradeModal(true); }}>Add Grade</Button></Col>
        </Row>
        <Table rowKey="id" columns={gradeColumns} dataSource={gradeLevels} loading={loading} size="small" pagination={false} />
      </Card>

      {/* ─── Sections ─── */}
      <Card title={<Space><HomeOutlined /> Sections</Space>}>
        <Row justify="end" style={{ marginBottom: 12 }}>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => openSectionModal()}>Add Section</Button></Col>
        </Row>
        <Table rowKey="id" columns={sectionColumns} dataSource={sections} loading={loading} size="small" pagination={false} />
      </Card>

      {/* ─── Academic Year Modal ─── */}
      <Modal title="Add Academic Year" open={yearModal} onOk={handleYearSubmit}
        onCancel={() => setYearModal(false)} okText="Save" destroyOnClose>
        <Form form={yearForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="year" label="Year" rules={[{ required: true }]}>
            <Input placeholder="e.g. 2025-2026" />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="endDate" label="End Date" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="isCurrent" label="Set as current?">
            <Select options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Grade Level Modal ─── */}
      <Modal title={editing ? "Edit Grade" : "Add Grade"} open={gradeModal}
        onOk={handleGradeSubmit} onCancel={() => { setGradeModal(false); setEditing(null); }}
        okText="Save" destroyOnClose>
        <Form form={gradeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Grade Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Grade-10" />
          </Form.Item>
          <Form.Item name="level" label="Level Number">
            <InputNumber style={{ width: "100%" }} placeholder="e.g. 10" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Section Modal ─── */}
      <Modal title={editing ? "Edit Section" : "Add Section"} open={sectionModal}
        onOk={handleSectionSubmit} onCancel={() => { setSectionModal(false); setEditing(null); }}
        okText="Save" destroyOnClose width={500}>
        <Form form={sectionForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="gradeLevelId" label="Grade Level" rules={[{ required: true }]}>
            <Select placeholder="Select Grade"
              options={gradeLevels.map((g) => ({ value: g.id, label: g.name }))} />
          </Form.Item>
          <Form.Item name="name" label="Section Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Section-A" />
          </Form.Item>
          <Form.Item name="teacherId" label="Class Teacher">
            <Select allowClear placeholder="Select Teacher"
              options={teachers.map((t) => ({ value: t.id, label: t.name }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="room" label="Room">
                <Input placeholder="e.g. Rm-201" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capacity" label="Capacity">
                <InputNumber style={{ width: "100%" }} min={1} max={100} placeholder="40" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ─── Enrollment Modal ─── */}
      <Modal title="Enroll Student" open={enrollModal} onOk={handleEnrollSubmit}
        onCancel={() => { setEnrollModal(false); setEnrollments([]); }}
        okText="Enroll" destroyOnClose width={600}>
        <Form form={enrollForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="studentId" label="Student" rules={[{ required: true }]}>
            <Select showSearch placeholder="Search student..."
              optionFilterProp="label"
              options={students.map((s) => ({ value: s.id, label: `${s.name} (${s.email})` }))} />
          </Form.Item>
        </Form>
        <Divider />
        <Text strong>Current Enrollments: {enrollments.length}</Text>
        <List
          size="small"
          dataSource={enrollments}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm title="Remove?"
                  onConfirm={async () => {
                    await api.delete(`/enrollments/${item.id}`);
                    message.success("Removed");
                    const { data } = await api.get(`/enrollments/section/${enrollSectionId}`);
                    setEnrollments(data.enrollments || []);
                  }}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ]}>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={item.student?.name}
                description={`${item.academicYear?.year}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: "No students enrolled" }}
        />
      </Modal>
    </div>
  );
}