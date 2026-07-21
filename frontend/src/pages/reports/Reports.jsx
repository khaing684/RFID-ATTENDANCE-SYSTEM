import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  DatePicker,
  Button,
  Table,
  Tag,
  Select,
  message,
  Statistic,
  Space,
} from "antd";

const { Text } = Typography;
import {
  DownloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import api from "../../config/api";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function Reports() {
  const [dateRange, setDateRange] = useState(null);
  const [reportType, setReportType] = useState("daily");
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { type: reportType };
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      const res = await api.get("/scanlogs/report", { params });
      setData(res.data.logs || []);
      setStats(res.data.stats);
      setHolidays(res.data.holidays || []);
    } catch {
      message.error("No Report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const columns = [
    { title: "Student", dataIndex: ["user", "name"], align:"center" },
    { title: "RFID", dataIndex: ["tag", "rfidCode"] , align:"center"},
    {
      title: "Type",
      dataIndex: "scanType",
      render: (v) => (
        <Tag color={v === "CHECK_IN" ? "green" : "orange"}>{v}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "scannedAt",
      render: (v) => (v ? new Date(v).toLocaleString("my-MM") : "-"),
    },
  ];

  const exportCSV = () => {
    const csv = [["Date", "Student", "RFID", "Type"].join(",")];
    data.forEach((r) =>
      csv.push(
        [r.scannedAt, r.user?.name, r.tag?.rfidCode, r.scanType].join(","),
      ),
    );
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${Date.now()}.csv`;
    a.click();
    message.success("Start CSV downloading....");
  };

  return (
    <div>
     <Row gutter={[16, 16]} style={{ padding:" 12px 12px" }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Scan"
              value={stats?.total ?? 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Check In"
              value={stats?.checkIns ?? 0}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Check Out"
              value={stats?.checkOuts ?? 0}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>
      {/* Holiday Alert - Report ထဲက အားလပ်ရက်များ */}
      {holidays.length > 0 && (
        <Row style={{ padding: "0 10px 12px" }}>
          <Col span={24}>
            <Card size="small" style={{ background: "#fff7e6", border: "1px solid #ffd591" }}>
              <Space>
                <CalendarOutlined style={{ color: "#fa8c16", fontSize: 18 }} />
                <Text strong style={{ color: "#d46b08" }}>
                  အားလပ်ရက်များ ({holidays.length} ရက်) — Report ထဲမှာ auto-skip လုပ်ထားပါသည်
                </Text>
              </Space>
              <div style={{ marginTop: 8 }}>
                {holidays.map((h, i) => (
                  <Tag key={i} color={h.type === "NATIONAL" ? "red" : h.type === "SCHOOL" ? "orange" : "purple"} style={{ marginBottom: 4 }}>
                    {h.date} — {h.name}
                  </Tag>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Report Table */}      
      <Row gutter={[12, 12]} align="middle" style={{ padding: "12px 10px"}}>
          <Col>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: 130 }}
              options={[
                { value: "daily", label: "Daily" },
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ]}
            />
          </Col>
          <Col>
            <RangePicker value={dateRange} onChange={setDateRange} />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchReport} loading={loading}>
              Search
            </Button>
          </Col>
          <Col>
            <Button icon={<DownloadOutlined />} onClick={exportCSV}>
              CSV Export
            </Button>
          </Col>
        </Row>
     

    
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          size="small"
          pagination={{ pageSize: 20, showTotal: (t) => `Total ${t}` }}
          locale={{ emptyText: "Select date range and click Search" }}
          style={{ padding:"6px 14px" }}
        />
      
    </div>
  );
}
