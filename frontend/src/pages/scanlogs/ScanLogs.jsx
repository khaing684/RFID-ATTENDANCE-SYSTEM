import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Tag,
  Select,
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  message,
  DatePicker,
  Space,
  Button,
} from "antd";
import {
  ScanOutlined,
  LoginOutlined,
  LogoutOutlined,
  CalendarOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import api from "../../config/api";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const roleColorMap = {
  ADMIN: "red",
  TEACHER: "orange",
  STUDENT: "blue",
};

const roleLabelMap = {
  ADMIN: "Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export default function ScanLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({ scanType: "" });
  const [dateRange, setDateRange] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: pagination.limit };
        if (filters.scanType) params.scanType = filters.scanType;
        if (dateRange) {
          params.startDate = dateRange[0].toISOString();
          params.endDate = dateRange[1].toISOString();
        }
        const { data } = await api.get("/scanlogs", { params });
        setLogs(data.logs || data.scanLogs || []);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      } catch {
        message.error("No Scan logs");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit, dateRange],
  );

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/scanlogs/stats");
      setStats(data.stats);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs]);

  const scanTypeMap = {
    CHECK_IN: { color: "green", text: "Check In" },
    CHECK_OUT: { color: "orange", text: "Check Out" },
    INVENTORY: { color: "blue", text: "Inventory" },
    LOCATE: { color: "purple", text: "Locate" },
  };

  const attendanceStatusMap = {
    ON_TIME: { color: "green", text: "On Time ✅" },
    LATE: { color: "orange", text: "Late ⚠️" },
    EARLY_LEAVE: { color: "red", text: "Early Leave 🚩" },
    FULL_DAY: { color: "blue", text: "Full Day 📋" },
  };

  const columns = [
    {
      title: "RFID Code",
      key: "rfidCode",
      align: "center",
      width: 140,
      render: (_, r) => <Tag color="blue">{r.tag?.rfidCode || "-"}</Tag>,
    },
    {
      title: "Device",
      key: "device",
      align: "center", 
      width: 130,
      render: (_, r) => r.device?.name || "-",
    },
    {
      title: "User",
      key: "user",
      align: "center", 
      width: 160,
      render: (_, r) =>
        r.user ? (
          <span>
            {r.user.name}{" "}
            <span style={{ color: roleColorMap[r.user.role], fontWeight: 500 }}>
              ({roleLabelMap[r.user.role]})
            </span>
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Scan Type",
      dataIndex: "scanType",
      align: "center", 
      width: 120,
      render: (v) => (
        <Tag color={scanTypeMap[v]?.color}>{scanTypeMap[v]?.text || v}</Tag>
      ),
    },
    {
      title: "Attendance",
      key: "attendanceStatus",
      align: "center",
      width: 130,
      render: (_, r) => {
        const s = attendanceStatusMap[r.attendanceStatus];
        return s ? <Tag color={s.color}>{s.text}</Tag> : "-";
      },
    },
     {
      title: "Date",
      dataIndex: "scannedAt",
      align: "center", 
      width: 110,
      render: (v) => new Date(v).toLocaleString("my-MM"),
    },
   
   
  ];

  return (
    <div>
      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ padding: "8px 8px" }}>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="Total Scan"
              value={stats?.total || 0}
              prefix={<ScanOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="Check In"
              value={stats?.checkIns || stats?.CHECK_IN || 0}
              prefix={<LoginOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="Check Out"
              value={stats?.checkOuts || stats?.CHECK_OUT || 0}
              prefix={<LogoutOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="Late ⚠️"
              value={stats?.late || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="Early Leave 🚩"
              value={stats?.earlyLeave || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters + Table in one Card */}
      <Row
        justify="space-between"
        align="middle"
        style={{ padding: "8px 8px" }}
      >
        <Col>
          <Space wrap>
            <Select
              placeholder="Scan Type"
              allowClear
              style={{ width: 150 }}
              value={filters.scanType || undefined}
              onChange={(v) => setFilters((f) => ({ ...f, scanType: v || "" }))}
              options={Object.entries(scanTypeMap).map(([k, v]) => ({
                value: k,
                label: v.text,
              }))}
            />
            <RangePicker value={dateRange} onChange={setDateRange} />
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setFilters({ scanType: "" });
                setDateRange(null);
              }}
            >
              Clear
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        bordered
        rowKey="id"
        columns={columns}
        dataSource={logs}
        loading={loading}
        scroll={{ x: 900 }}
        size= "small"
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showTotal: (t) => `Total ${t}`,
          showSizeChanger: true,
          onChange: (p, s) =>
            setPagination((prev) => ({ ...prev, page: p, limit: s })),
        }}
        locale={{ emptyText: "No Scan log " }}
        style={{ padding: "4px 8px"}}
      />
    </div>
  );
}
