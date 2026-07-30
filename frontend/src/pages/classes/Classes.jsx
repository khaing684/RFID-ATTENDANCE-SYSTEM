import { useState, useEffect } from "react";
import { Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Card, Row, Col, message, Tag, Divider, Badge, Empty, List, Avatar } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, ClearOutlined, CloseCircleOutlined } from "@ant-design/icons";
import api from "../../config/api";

export default function Classes() {
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("ALL");

  const [gradeForm] = Form.useForm();
  const [classForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, cRes, tRes, sRes] = await Promise.all([
        api.get("/grades"),
        api.get("/classes"),
        api.get("/users?role=TEACHER&limit=100"),
        api.get("/users?role=STUDENT&limit=500"),
      ]);
      setGrades(gRes.data.grades || []);
      setClasses(cRes.data.classes || []);
      setTeachers(tRes.data.users || []);
      setStudents(sRes.data.users || []);
    } catch { message.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

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

  const handleClassSubmit = async () => {
    try {
      const values = await classForm.validateFields();
      let classId;
      if (editing) {
        await api.patch(`/classes/${editing.id}`, values);
        message.success("Class updated");
        classId = editing.id;

        // Assign existing students (edit mode)
        const existingIds = values.existingStudents || [];
        for (const sid of existingIds) {
          try { await api.patch(`/users/${sid}`, { classId }); } catch { /* skip */ }
        }

        // Create new students (edit mode)
        const names = (values.studentNames || "").split("\n").map(s => s.trim()).filter(Boolean);
        let count = 0;
        for (const name of names) {
          try {
            await api.post("/users", {
              name,
              email: `${name.toLowerCase().replace(/\s/g, "")}${Date.now()}@gmail.com`,
              password: "password123",
              role: "STUDENT",
              classId,
            });
            count++;
          } catch { /* skip */ }
        }
        const totalAdded = existingIds.length + count;
        if (totalAdded > 0) message.success(`${totalAdded} student(s) added to class`);
      } else {
        const { data } = await api.post("/classes", values);
        message.success("Class created");
        classId = data.class.id;

        // Assign existing students
        const existingIds = values.existingStudents || [];
        for (const sid of existingIds) {
          try { await api.patch(`/users/${sid}`, { classId }); } catch { /* skip */ }
        }

        // Create new students
        const names = (values.studentNames || "").split("\n").map(s => s.trim()).filter(Boolean);
        let count = 0;
        for (const name of names) {
          try {
            await api.post("/users", {
              name,
              email: `${name.toLowerCase().replace(/\s/g, "")}${Date.now()}@gmail.com`,
              password: "password123",
              role: "STUDENT",
              classId,
            });
            count++;
          } catch { /* skip */ }
        }
        const totalAdded = existingIds.length + count;
        if (totalAdded > 0) message.success(`${totalAdded} student(s) added to class`);
      }
      classForm.resetFields();
      setClassModal(false);
      setEditing(null);
      fetchData();
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };
  

  const openClassModal = async (record = null) => {
    setEditing(record);
    if (record) {
      classForm.setFieldsValue({
        name: record.name,
        gradeId: record.gradeId,
        teacherId: record.teacherId || undefined,
      });
      // Fetch enrolled students from API by classId (matches backend _count)
      try {
        const { data } = await api.get("/users", { params: { classId: record.id, limit: 500 } });
        setClassStudents(data.users || []);
      } catch {
        setClassStudents([]);
      }
    } else {
      classForm.resetFields();
      setClassStudents([]);
    }
    setClassModal(true);
  };

  // Student ဖြုတ်ချင်ပါက သုံးနိုင်သော Quick Remove Function
  const handleRemoveStudentFromClass = async (studentId) => {
    try {
      await api.patch(`/users/${studentId}`, { classId: null });
      setClassStudents((prev) => prev.filter((s) => s.id !== studentId));
      message.success("Student removed from class");
      fetchData();
    } catch {
      message.error("Failed to remove student");
    }
  };

  // Grade Filter
  const filteredGrades = selectedGradeFilter === "ALL" 
    ? grades 
    : grades.filter(g => g.id === selectedGradeFilter);

  // Data Preparation for Table
  const tableData = [];
  filteredGrades.forEach((grade) => {
    const matchedClasses = classes.filter((c) => c.gradeId === grade.id);

    if (matchedClasses.length === 0) {
      tableData.push({
        key: `empty-${grade.id}`,
        grade,
        rowSpan: 1,
        isClassEmpty: true,
      });
    } else {
      matchedClasses.forEach((cls, index) => {
        tableData.push({
          key: cls.id,
          grade,
          class: cls,
          rowSpan: index === 0 ? matchedClasses.length : 0,
          isClassEmpty: false,
        });
      });
    }
  });

  const columns = [
    {
      title: "Grade",
      key: "grade",
      width: 160,
      onCell: (record) => ({ rowSpan: record.rowSpan }),
      render: (_, record) => (
        <strong style={{ fontSize: 14, color: "#1677ff" }}>{record.grade.name}</strong>
      ),
    },
    {
      title: "Class",
      key: "type",
      width: 120,
      onCell: (record) => ({ rowSpan: record.rowSpan }),
      render: (_, record) => (
        <Tag color={record.grade.type === "ONLINE" ? "geekblue" : "green"}>
          {record.grade.type}
        </Tag>
      ),
    },
    {
      title: "Section / Class",
      key: "className",
      render: (_, record) =>
        record.isClassEmpty ? (
          <span style={{ color: "#bfbfbf", fontStyle: "italic" }}>No section created</span>
        ) : (
          <strong>{record.class.name}</strong>
        ),
    },
    {
      title: "Class Teacher",
      key: "teacher",
      render: (_, record) => {
        if (record.isClassEmpty) return "-";
        return record.class.teacher?.name ? (
          <span>
            <UserOutlined style={{ marginRight: 6, color: "#1677ff" }} />
            {record.class.teacher.name}
          </span>
        ) : (
          <Tag color="default">Not Assigned</Tag>
        );
      },
    },
    {
      title: "Students Count",
      key: "students",
      render: (_, record) => {
        if (record.isClassEmpty) return "-";
        return (
          <Badge
            count={`${record.class._count?.students || 0} Students`}
            style={{ backgroundColor: "#52c41a" }}
          />
        );
      },
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => {
        if (record.isClassEmpty) {
          return (
            <Button
              type="primary"
              ghost
              size="small"
              icon={<PlusOutlined />}
              onClick={() => openClassModal()}
            >
              Add Section
            </Button>
          );
        }
        return (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openClassModal(record.class)}>
              Edit
            </Button>
            <Popconfirm
              title="Delete?"
              onConfirm={async () => {
                await api.delete(`/classes/${record.class.id}`);
                fetchData();
                message.success("Deleted");
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        title={
          <Space>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                gradeForm.resetFields();
                setGradeModal(true);
              }}
            >
              Add Grade
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openClassModal()}>
              Add Class
            </Button>
          </Space>
        }
        extra={
          <Space>
            <span style={{ fontSize: 13, color: "#8c8c8c" }}>Filter by Grade:</span>
            <Select
              value={selectedGradeFilter}
              style={{ width: 180 }}
              onChange={(value) => setSelectedGradeFilter(value)}
              options={[
                { value: "ALL", label: "All Grades" },
                ...grades.map((g) => ({ value: g.id, label: `${g.name} (${g.type})` })),
              ]}
            />
            <Button size="small" icon={<ClearOutlined />} onClick={() => setSelectedGradeFilter("ALL")}>
              Clear
            </Button>
          </Space>
        }
        style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <Table
          rowKey="key"
          columns={columns}
          dataSource={tableData}
          loading={loading}
          bordered
          pagination={false}
          size="small"
        />
      </Card>

      {/* Grade Modal */}
      <Modal 
        title={editing ? "Edit Grade" : "Add Grade"} 
        open={gradeModal}
        onOk={handleGradeSubmit} 
        onCancel={() => { setGradeModal(false); setEditing(null); }} 
        okText="Save" 
        destroyOnClose
      >
        <Form form={gradeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Grade Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Grade-10" />
          </Form.Item>
          <Form.Item name="type" label="Subject" rules={[{ required: true }]}>
            <Input placeholder="e.g. Myanmar" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Class Modal (Improved UI/UX Design) */}
      <Modal 
        title={editing ? `Edit Class (${editing.name})` : "Add Class"} 
        open={classModal}
        onOk={handleClassSubmit} 
        onCancel={() => { setClassModal(false); setEditing(null); }} 
        okText="Save Changes" 
        destroyOnClose 
        width={550}
      >
        <Form form={classForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gradeId" label="Grade" rules={[{ required: true }]}>
                <Select options={grades.map((g) => ({ value: g.id, label: `${g.name} (${g.type})` }))} placeholder="Select Grade" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Section Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Section-A" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="teacherId" label="Class Teacher">
            <Select allowClear placeholder="Select Teacher" options={teachers.map((t) => ({ value: t.id, label: t.name }))} />
          </Form.Item>

          {editing ? (
            <>
              <Divider orientation="left" style={{ fontSize: 13, color: "#8c8c8c" }}>
                Enrolled Students ({classStudents.length})
              </Divider>

              <div 
                style={{ 
                  maxHeight: 180, 
                  overflowY: "auto", 
                  padding: 12, 
                  background: "#fafafa", 
                  borderRadius: 8, 
                  border: "1px solid #f0f0f0" 
                }}
              >
                {classStudents.length > 0 ? (
                  <Row gutter={[8, 8]}>
                    {classStudents.map((s) => (
                      <Col key={s.id}>
                        <Tag 
                          color="blue" 
                          style={{ 
                            padding: "4px 8px", 
                            fontSize: 13, 
                            borderRadius: 4, 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 6 
                          }}
                        >
                          <UserOutlined />
                          <span>{s.name}</span>
                          <Popconfirm 
                            title="Remove from class?" 
                            onConfirm={() => handleRemoveStudentFromClass(s.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <CloseCircleOutlined style={{ cursor: "pointer", color: "#ff4d4f" }} />
                          </Popconfirm>
                        </Tag>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No students in this class" />
                )}
              </div>

              <Divider orientation="left" style={{ fontSize: 13, color: "#8c8c8c" }}>
                Add More Students
              </Divider>
              <Form.Item name="existingStudents" label="Add Existing Students">
                <Select 
                  mode="multiple" 
                  allowClear 
                  placeholder="Search and select students..."
                  showSearch 
                  optionFilterProp="label"
                  maxTagCount="responsive"
                  options={students
                    .filter((s) => !s.classId)
                    .map((s) => ({ value: s.id, label: `${s.name} (${s.email})` }))} 
                />
              </Form.Item>
              <Form.Item name="studentNames" label="Or Quick Add New Students (One name per line)">
                <Input.TextArea rows={3} placeholder={"Mg Mg\nAye Aye\nKo Ko"} />
              </Form.Item>
            </>
          ) : (
            <>
              <Divider orientation="left" style={{ fontSize: 13, color: "#8c8c8c" }}>Students Setup</Divider>
              <Form.Item name="existingStudents" label="Add Existing Students">
                <Select 
                  mode="multiple" 
                  allowClear 
                  placeholder="Search and select students..."
                  showSearch 
                  optionFilterProp="label"
                  maxTagCount="responsive"
                  options={students
                    .filter((s) => !s.classId)
                    .map((s) => ({ value: s.id, label: `${s.name} (${s.email})` }))} 
                />
              </Form.Item>
              <Form.Item name="studentNames" label="Or Quick Add New Students (One name per line)">
                <Input.TextArea rows={3} placeholder={"Mg Mg\nAye Aye\nKo Ko"} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}