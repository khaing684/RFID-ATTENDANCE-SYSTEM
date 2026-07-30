import { useState, useEffect } from "react";
import { Row, Col, Card, Statistic, Typography, Table, Tag, Spin } from "antd";
import {
  TagOutlined,
  LaptopOutlined,
  ScanOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  IdcardOutlined,
  TeamOutlined,
  WifiOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import api from "../../config/api";

const { Title, Text } = Typography;

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/dashboard");
      setStats(data.stats);
      setRecentLogs(data.recentLogs || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const scanTypeMap = {
    CHECK_IN: { color: "green", text: "Check In" },
    CHECK_OUT: { color: "orange", text: "Check Out" },
    INVENTORY: { color: "blue", text: "Inventory" },
  };

  const attendanceStatusMap = {
    ON_TIME: { color: "green", text: "On Time ✅" },
    LATE: { color: "orange", text: "Late ⚠️" },
    EARLY_LEAVE: { color: "red", text: "Early Leave 🚩" },
    FULL_DAY: { color: "blue", text: "Full Day 📋" },
  };

  const recentColumns = [
    {
      title: "User",
      key: "user",
      align: "center",
      render: (_, r) => {
        const name = r.user?.name || "-";
        const role = r.user?.role;
        return role
          ? `${name} (${role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Teacher" : "Student"})`
          : name;
      },
    },
    { title: "RFID Code", dataIndex: ["tag", "rfidCode"], key: "rfid" ,  align: "center"},
    {
      title: "Type",
      dataIndex: "scanType",
      key: "type",
      align: "center",
      render: (type) => {
        const info = scanTypeMap[type] || { color: "default", text: type };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: "Attendance",
      key: "attendance",
      align: "center",
      render: (_, r) => {
        const s = attendanceStatusMap[r.attendanceStatus];
        return s ? <Tag color={s.color}>{s.text}</Tag> : "-";
      },
    },
    { title: "Device", dataIndex: ["device", "name"], key: "device",  align: "center" },
    {
      title: "Date",
      dataIndex: "scannedAt",
      key: "time",
      align: "center",
      render: (d) => (d ? new Date(d).toLocaleString("en-US", { timeZone: "Asia/Yangon" }) : "-"),
    },
  ];

  if (loading && !stats) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="medium" />
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {/* ========== ADMIN CARDS ========== */}
      {user?.role === "ADMIN" && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 6 }}>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="All Tag"
                  value={stats?.totalTags ?? 0}
                  prefix={<TagOutlined />}
                  valueStyle={{ color: "#1677ff" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="Active Tag"
                  value={stats?.activeTags ?? 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="All Device"
                  value={stats?.totalDevices ?? 0}
                  prefix={<LaptopOutlined />}
                  valueStyle={{ color: "#1677ff" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="Online Devices"
                  value={stats?.onlineDevices ?? 0}
                  prefix={<WifiOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="All User"
                  value={stats?.totalUsers ?? 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="Today Scan"
                  value={stats?.todayScans ?? 0}
                  prefix={<ScanOutlined />}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="Today Check In"
                  value={stats?.todayCheckIns ?? 0}
                  prefix={<LoginOutlined />}
                  valueStyle={{ color: "#52c41a", fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="ဒီနေ့ Check Out"
                  value={stats?.todayCheckOuts ?? 0}
                  prefix={<LogoutOutlined />}
                  valueStyle={{ color: "#faad14", fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="Late ⚠️"
                  value={stats?.todayLate ?? 0}
                  prefix={<LoginOutlined />}
                  valueStyle={{ color: "#faad14", fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card style={{ height: "100%" }}>
                <Statistic
                  title="Early Leave 🚩"
                  value={stats?.todayEarlyLeave ?? 0}
                  prefix={<LogoutOutlined />}
                  valueStyle={{ color: "#ff4d4f", fontSize: 24 }}
                />
              </Card>
            </Col>
          </Row>

        </>
      )}

      {/* ========== TEACHER CARDS ========== */}
      {user?.role === "TEACHER" && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8} md={6}>
            <Card style={{ height: "100%" }}>
              <Statistic
                title="ကျွန်ုပ်၏ Tag များ"
                value={stats?.myTagsCount ?? 0}
                prefix={<IdcardOutlined />}
                valueStyle={{ color: "#1677ff" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card style={{ height: "100%" }}>
              <Statistic
                title="ဒီနေ့ Scan"
                value={stats?.todayScans ?? 0}
                prefix={<ScanOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* ========== STUDENT CARDS ========== */}
      {user?.role === "STUDENT" && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8} md={6}>
            <Card style={{ height: "100%" }}>
              <Statistic
                title="ကျွန်ုပ်၏ RFID"
                value={stats?.myTagCode ?? "-"}
                prefix={<IdcardOutlined />}
                valueStyle={{ color: "#1677ff", fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card style={{ height: "100%" }}>
              <Statistic
                title="ဒီနေ့ Scan အကြိမ်"
                value={stats?.todayScans ?? 0}
                prefix={<ScanOutlined />}
                valueStyle={{ color: "#52c41a", fontSize: 24 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* ========== Recent Logs (all roles) ========== */}
      <Table
        dataSource={recentLogs}
        columns={recentColumns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={false}
        locale={{ emptyText: "No Scan data " }}
      />
    </div>
  );
}
