import { useState, useEffect } from "react";
import {
  Select, Button, Table, Tag, Modal, Form, Input, TimePicker,
  Typography, Space, message, Popconfirm, Empty, Tooltip,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined,
  CalendarOutlined, PlusCircleOutlined,
  ClearOutlined, CoffeeOutlined, InfoCircleOutlined,
  PrinterOutlined
} from "@ant-design/icons";
import api from "../../config/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Yangon");

const { Title, Text } = Typography;
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const STORAGE_KEY = "timetable_selected_class";
const fmt = (t) => t ? dayjs(t, "HH:mm").format("h:mm A") : "";

export default function Timetable() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedClass, setSelectedClass] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [loading, setLoading] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [entryModal, setEntryModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [lunchStart, setLunchStart] = useState();
  const [lunchEnd, setLunchEnd] = useState();
  const [lunchModal, setLunchModal] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [subjectForm] = Form.useForm();
  const [entryForm] = Form.useForm();

  // ── Data Fetching ──

  useEffect(() => { fetchInitial(); }, []);

  const fetchInitial = async () => {
    try {
      const [cRes, sRes, tRes, hRes, settingsRes] = await Promise.all([
        api.get("/classes"),
        api.get("/subjects"),
        api.get("/users?role=TEACHER&limit=100"),
        api.get("/holidays?year=2026"),
        api.get("/settings"),
      ]);
      setClasses(cRes.data.classes || []);
      setSubjects(sRes.data.subjects || []);
      setTeachers(tRes.data.users || []);
      setHolidays(hRes.data.holidays || []);
      if (settingsRes.data.settings?.lunch_start_time) {
        setLunchStart(settingsRes.data.settings.lunch_start_time);
        setLunchEnd(settingsRes.data.settings.lunch_end_time || "13:00");
      }
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

  // ── Subject CRUD ──

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

  // ── Timetable Entry CRUD ──

  const handleEntrySubmit = async () => {
    try {
      const values = await entryForm.validateFields();

      if (!selectedClass || !classes.find((c) => c.id === selectedClass)) {
        message.error("Please select a valid class first");
        return;
      }

      const payload = {
        classId: selectedClass,
        subjectId: values.subjectId,
        teacherId: values.teacherId || null,
        dayOfWeek: values.dayOfWeek,
        startTime: values.timeRange[0].format("HH:mm"),
        endTime: values.timeRange[1].format("HH:mm"),
      };
      if (editing) {
        await api.patch(`/timetable/${editing.id}`, payload);
        message.success("Timetable updated");
      } else {
        await api.post("/timetable", payload);
        message.success("Timetable entry added");
      }
      entryForm.resetFields();
      setEntryModal(false);
      setEditing(null);
      fetchTimetable();
    } catch (err) { if (err.response) message.error(err.response.data?.message || "Error"); }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await api.delete(`/timetable/${id}`);
      message.success("Entry deleted");
      setEntryModal(false);
      setEditing(null);
      fetchTimetable();
    } catch { message.error("Delete failed"); }
  };

  // 🌟 UX Improvement: Support Quick Add with pre-filled day & time
  const openEntryModal = (record = null, defaultDay = null, defaultSlot = null) => {
    setEditing(record);
    if (record) {
      entryForm.setFieldsValue({
        subjectId: record.subjectId,
        teacherId: record.teacherId || null,
        dayOfWeek: record.dayOfWeek,
        timeRange: [dayjs(record.startTime, "HH:mm"), dayjs(record.endTime, "HH:mm")],
      });
    } else if (defaultDay && defaultSlot) {
      const [s, e] = defaultSlot.split("-");
      entryForm.setFieldsValue({
        dayOfWeek: defaultDay,
        timeRange: [dayjs(s, "HH:mm"), dayjs(e, "HH:mm")],
      });
    } else {
      entryForm.resetFields();
    }
    setEntryModal(true);
  };

  // ── Grid Data (Days as rows, Periods as columns) ──
  const timeSlots = [...new Set(entries.map((e) => `${e.startTime}-${e.endTime}`))].sort();
  const lunchSlot = { key: "lunch", start: lunchStart, end: lunchEnd, isLunch: true };

  const allSlots = [...timeSlots, lunchSlot.key].sort((a, b) => {
    if (a === "lunch") return lunchStart.localeCompare(b.split("-")[0]);
    if (b === "lunch") return a.split("-")[0].localeCompare(lunchStart);
    return a.localeCompare(b);
  });

  const slotData = allSlots.map((slot) => {
    if (slot === "lunch") return lunchSlot;
    const [s, e] = slot.split("-");
    return { key: slot, start: s, end: e };
  });

  const getEntry = (dayIdx, slotKey) => {
    if (slotKey === "lunch") return null;
    const [start, end] = slotKey.split("-");
    return entries.find((e) => e.dayOfWeek === dayIdx && e.startTime === start && e.endTime === end);
  };

  // ── Current Week Dates ──
  const thisWeekDates = (() => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const holiday = holidays.find((h) => {
        const hd = new Date(h.date);
        return hd.toISOString().split("T")[0] === dateStr;
      });
      return { date: d, dateStr, holiday, isPast: d < new Date(today.toDateString()) };
    });
  })();

  // Days as rows
  const gridData = DAYS.map((day, idx) => {
    const weekDay = thisWeekDates[idx];
    return {
      key: `day-${idx}`,
      dayName: day,
      dayIdx: idx + 1,
      weekDay,
      isHoliday: !!weekDay?.holiday,
    };
  });

  const renderEntryCell = (entry, dayIdx, slotKey) => {
    if (!entry) {
      return (
        <div onClick={() => openEntryModal(null, dayIdx, slotKey)}
          style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", color: "#bfbfbf" }}
          className="empty-cell-hover"
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f7ff"; e.currentTarget.style.color = "#1677ff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#bfbfbf"; }}>
          <Tooltip title="Click to add schedule"><PlusCircleOutlined style={{ fontSize: 16 }} /></Tooltip>
        </div>
      );
    }
    const c = entry.subject?.color || "#1677ff";
    return (
      <Tooltip title="Click to edit schedule">
        <div onClick={() => openEntryModal(entry)}
          style={{ cursor: "pointer", height: 64, padding: "8px 12px", boxSizing: "border-box", background: `${c}0D`, borderLeft: `4px solid ${c}`, display: "flex", flexDirection: "column", justifyContent: "center", transition: "all 0.2s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${c}20`; e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = `${c}0D`; e.currentTarget.style.transform = "scale(1)"; }}>
          <Text strong style={{ fontSize: 13, color: "#1f1f1f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.subject?.name}</Text>
          {entry.subject?.code && <Text type="secondary" style={{ fontSize: 11 }}>{entry.subject.code}</Text>}
          {entry.teacher?.name && <Text type="secondary" style={{ fontSize: 10, color: "#8c8c8c", marginTop: 1 }}>{entry.teacher.name}</Text>}
        </div>
      </Tooltip>
    );
  };

  // ── Grid Columns (Day | Period 1 | Period 2 | ... | Lunch | ...) ──
  const gridColumns = [
    {
      title: "Day",
      key: "day",
      width: 100,
      fixed: "left",
      onCell: (record) => ({
        style: { padding: 0 },
        colSpan: 1,
      }),
      render: (_, record) => {
        const { dayName, weekDay, isHoliday } = record;
        return (
          <div style={{ height: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, background: isHoliday ? "#fff1f0" : "#fafafa", borderLeft: isHoliday ? "3px solid #ff4d4f" : "none", borderBottom: "1px solid #f0f0f0" }}>
            <Text strong style={{ fontSize: 13, color: isHoliday ? "#cf1322" : "#262626" }}>{dayName.substring(0, 3)}</Text>
            <Text style={{ fontSize: 11, color: isHoliday ? "#cf1322" : "#8c8c8c" }}>{weekDay?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
          </div>
        );
      },
    },
    ...slotData.map((slot, colIdx) => {
      const isFirst = colIdx === 0;
      const holidayColSpan = isFirst ? slotData.length : 0;
      if (slot.isLunch) {
        return {
          title: (
            <div style={{ textAlign: "center", lineHeight: 1.2 }}>
            <Text strong style={{ fontSize: 12, color: "#262626", display: "block" }}>{fmt(lunchStart)}</Text>
            <Text type="secondary" style={{ fontSize: 10 }}>to</Text>
            <Text strong style={{ fontSize: 12, color: "#262626", display: "block" }}>{fmt(lunchEnd)}</Text>
          </div>
          ),
          key: "lunch",
          width: 140,
          onCell: (record) => ({ style: { padding: 0 }, colSpan: record.isHoliday ? (isFirst ? slotData.length : 0) : 1 }),
          render: (_, record) => (
            <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff7e6", borderBottom: "1px dashed #ffd591", gap: 6 }}>
              <CoffeeOutlined style={{ color: "#fa8c16", fontSize: 16 }} />
              <Text style={{ color: "#d46b08", fontWeight: 600, fontSize: 13 }}>Lunch Break</Text>
            </div>
           
          ),
        };
      }
      const [start, end] = slot.key.split("-");
      return {
        title: (
          <div style={{ textAlign: "center", lineHeight: 1.2 }}>
            <Text strong style={{ fontSize: 12, color: "#262626", display: "block" }}>{fmt(start)}</Text>
            <Text type="secondary" style={{ fontSize: 10 }}>to</Text>
            <Text strong style={{ fontSize: 12, color: "#262626", display: "block" }}>{fmt(end)}</Text>
          </div>
        ),
        key: slot.key,
        width: 140,
        onCell: (record) => ({ style: { padding: 0 }, colSpan: record.isHoliday ? holidayColSpan : 1 }),
        render: (_, record) => {
          if (record.isHoliday && isFirst) {
            return (
              <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(90deg, #fff1f0 0%, #fff 100%)", borderLeft: "3px solid #ff4d4f" }}>
                <Text style={{ color: "#cf1322", fontSize: 12 }}>🎉 {record.weekDay.holiday.name}</Text>
              </div>
            );
          }
          if (record.isHoliday) return null;
          return renderEntryCell(getEntry(record.dayIdx, slot.key), record.dayIdx, slot.key);
        },
      };
    }),
  ];

  // ── Subject Table Columns ──

  const subjectColumns = [
    { title: "Code", dataIndex: "code", width: 100, render: (v, r) => <Tag color={r.color || "blue"}>{v}</Tag> },
    { title: "Subject", dataIndex: "name" },
    {
      title: "Color", dataIndex: "color", width: 100,
      render: (v) => (
        <Space>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: v || "#1677ff" }} />
          <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>
        </Space>
      ),
    },
    {
      title: "Action", key: "action", width: 100, align: "right",
      render: (_, r) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />}
              onClick={() => { setEditing(r); subjectForm.setFieldsValue(r); setSubjectModal(true); }} />
          </Tooltip>
          <Popconfirm title="Delete subject?" onConfirm={async () => { await api.delete(`/subjects/${r.id}`); fetchInitial(); message.success("Deleted"); }}>
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f5f5" }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "12px 24px", borderBottom: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Space wrap>
          <Button icon={<BookOutlined />} onClick={() => { setEditing(null); subjectForm.resetFields(); setSubjectModal(true); }}>
            Manage Subject
          </Button>
          <Button icon={<CoffeeOutlined />} onClick={() => setLunchModal(true)}>
            Set Lunch Break
          </Button>
          {holidays.length > 0 && (
            <Tooltip
              title={
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {holidays.map((h) => (
                    <div key={h.id} style={{ fontSize: 12, padding: "2px 0" }}>
                      {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {h.name}
                    </div>
                  ))}
                </div>
              }
            >
              <Button size="small" type="text" icon={<InfoCircleOutlined />}
                style={{ color: "#fa8c16" }}>
                {holidays.length} holidays
              </Button>
            </Tooltip>
          )}
        </Space>
        <Space>
          <Select
            placeholder="Select Class"
            style={{ width: 250 }}
            value={selectedClass}
            onChange={(val) => {
              setSelectedClass(val);
              if (val) localStorage.setItem(STORAGE_KEY, val);
              else localStorage.removeItem(STORAGE_KEY);
            }}
            options={classes.map((c) => ({ value: c.id, label: `${c.grade?.name || ""} - ${c.name}` }))}
          />
        
            <>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openEntryModal()}>
                Add Entry
              </Button>
             <Button size="small" icon={<ClearOutlined />} onClick={() => {
                setSelectedClass(null);
                localStorage.removeItem(STORAGE_KEY);
              }}>
              Clear
            </Button>
            </>
       
        </Space>
      </div>

      {/* Today's holiday alert */}
      {(() => {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const todayHoliday = holidays.find((h) => {
          const hDate = new Date(h.date);
          return hDate.toISOString().split("T")[0] === todayStr;
        });
        return todayHoliday ? (
          <div style={{ background: "#fff7e6", padding: "8px 24px", borderBottom: "1px solid #ffd591", display: "flex", alignItems: "center", gap: 8 }}>
            <InfoCircleOutlined style={{ color: "#fa8c16" }} />
            <Text style={{ color: "#d46b08" }}>
              <strong>Today ({today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })})</strong> — {todayHoliday.name} 🎉
            </Text>
          </div>
        ) : null;
      })()}

      {/* Table */}
      <div style={{ flex: 1, padding: "16px 24px", overflow: "auto" }}>
        {!selectedClass ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Empty description="Select a class to view timetable" />
          </div>
        ) : (
          <Table
            rowKey="key"
            columns={gridColumns}
            dataSource={gridData}
            loading={loading}
            size="middle"
            pagination={false}
            scroll={{ x: 900 }}
            bordered
            style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}
          />
        )}
      </div>

      {/* Subject Modal */}
      <Modal title={editing ? "Edit Subject" : "Add Subject"} open={subjectModal}
        onOk={handleSubjectSubmit}
        onCancel={() => { setSubjectModal(false); setEditing(null); }} okText="Save" destroyOnClose>
        <Form form={subjectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="code" label="Subject Code" rules={[{ required: true }]}>
            <Input placeholder="e.g. MATH-101" />
          </Form.Item>
          <Form.Item name="name" label="Subject Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Mathematics" />
          </Form.Item>
          <Form.Item name="color" label="Color" initialValue="#1677ff">
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

      {/* Entry Modal */}
      <Modal title={editing ? "Edit Schedule Entry" : "Add Schedule Entry"} open={entryModal}
        onOk={handleEntrySubmit}
        onCancel={() => { setEntryModal(false); setEditing(null); }} okText="Save" destroyOnClose
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space>
            {editing && (
              <Popconfirm title="Delete this entry?" onConfirm={() => handleDeleteEntry(editing.id)}>
                <Button danger icon={<DeleteOutlined />}>Delete</Button>
              </Popconfirm>
            )}
            <CancelBtn />
            <OkBtn />
          </Space>
        )}
      >
        <Form form={entryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="teacherId" label="Teacher">
  <Select placeholder="Select Teacher"
    options={teachers.map((t) => ({ value: t.id, label: t.name }))} />
</Form.Item>
          <Form.Item name="subjectId" label="Subject" rules={[{ required: true }]}>
            <Select placeholder="Select Subject"
              options={subjects.map((s) => ({ value: s.id, label: <Space><Tag color={s.color}>{s.code}</Tag> {s.name}</Space> }))} />
          </Form.Item>
          <Form.Item name="dayOfWeek" label="Day" rules={[{ required: true }]}>
            <Select placeholder="Select Day" options={DAYS.map((d, i) => ({ value: i + 1, label: d }))} />
          </Form.Item>
          <Form.Item name="timeRange" label={<Space size={4}>Time Range <Tag style={{ fontSize: 10, lineHeight: "16px" }}>Asia/Yangon</Tag></Space>} rules={[{ required: true }]}>
            <TimePicker.RangePicker format="h:mm A" minuteStep={5} style={{ width: "100%" }} use12Hours />
          </Form.Item>
        
        </Form>
      </Modal>

      {/* Lunch Break Modal */}
      <Modal title={<Space><CoffeeOutlined style={{ color: "#fa8c16" }} /> Set Lunch Break</Space>}
        open={lunchModal}
        onOk={async () => {
          try {
            await api.put("/settings", {
              lunch_start_time: lunchStart,
              lunch_end_time: lunchEnd,
            });
            message.success("Lunch break updated");
            setLunchModal(false);
          } catch { message.error("Failed to save lunch break"); }
        }}
        onCancel={() => setLunchModal(false)}
        okText="Save"
      >
        <Space direction="vertical" style={{ width: "100%", marginTop: 16 }}>
          <Text>Lunch break will appear as a special row in the timetable.</Text>
          <Space>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Start Time</Text>
              <TimePicker format="h:mm A" use12Hours
                value={dayjs(lunchStart, "HH:mm")}
                onChange={(t) => t && setLunchStart(t.format("HH:mm"))}
                minuteStep={5}
              />
            </div>
            <Text style={{ marginTop: 24 }}>—</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>End Time</Text>
              <TimePicker format="h:mm A" use12Hours
                value={dayjs(lunchEnd, "HH:mm")}
                onChange={(t) => t && setLunchEnd(t.format("HH:mm"))}
                minuteStep={5}
              />
            </div>
          </Space>
        </Space>
      </Modal>
    </div>
  );
}
