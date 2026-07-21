import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Avatar,
  Row,
  Col,
  Tag,
  Modal,
  Space,
  Divider,
  TimePicker,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  SettingOutlined,
  IdcardOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import api from "../../config/api";
import dayjs from "dayjs";
import HolidayManagement from "./HolidayManagement";

const { Title, Text } = Typography;

export default function Settings() {
  const { user } = useSelector((state) => state.auth);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [systemForm] = Form.useForm();

  const [sysLoading, setSysLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (user?.role === "ADMIN") fetchSystemSettings();
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      });
    }
  }, [user]);

  const fetchSystemSettings = async () => {
    try {
      const { data } = await api.get("/settings");
      systemForm.setFieldsValue({
        school_start_time: data.settings.school_start_time
          ? dayjs(data.settings.school_start_time, "HH:mm")
          : dayjs("08:00", "HH:mm"),
        school_end_time: data.settings.school_end_time
          ? dayjs(data.settings.school_end_time, "HH:mm")
          : dayjs("16:00", "HH:mm"),
        late_threshold_minutes: data.settings.late_threshold_minutes || "30",
      });
    } catch {
     
    }
  };

  const handleProfileUpdate = (values) => {
    message.success("Profile Update Successfully");
  };

  const handlePasswordChange = (values) => {
    console.log("Password Changed:", values);
    message.success("Password Change Successfully");
    passwordForm.resetFields();
    setIsPasswordModalOpen(false);
  };

  const handleSystemUpdate = async (values) => {
    setSysLoading(true);
    try {
      const payload = {
        school_start_time: values.school_start_time.format("HH:mm"),
        school_end_time: values.school_end_time.format("HH:mm"),
        late_threshold_minutes: String(values.late_threshold_minutes),
      };
      await api.put("/settings", payload);
      message.success("Create System Settings Successfully");
    } catch {
      message.error("Create System Settings Failed");
    } finally {
      setSysLoading(false);
    }
  };

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: "32px 24px" }}>
      {/* ကတ်တွေကို စနစ်တကျ ထိန်းပေးမယ့် အလယ် Container */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Row gutter={[24, 24]} justify="center">
          
          {/* ဘယ်ဘက်ခြမ်း: Profile Card (ကျယ်ဝန်းမှုရော၊ အမြင့်ပါ ညာဘက်ခြမ်းနဲ့ ညီမျှစေပါတယ်) */}
          <Col xs={24} md={user?.role === "ADMIN" ? 12 : 16} lg={user?.role === "ADMIN" ? 12 : 14}>
            <Card
              title={
                <Space>
                  <IdcardOutlined style={{ color: "#1890ff" }} />
                  <span>Profile Info </span>
                </Space>
              }
              style={{
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                border: "none",
                height: "100%", 
              }}
              bodyStyle={{
                height: "calc(100% - 58px)", 
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <Row gutter={[16, 16]} align="top">
                {/* Profile Avatar & Name Section */}
                <Col xs={24} sm={8} style={{ textAlign: "center", paddingTop: "8px", marginBottom: 16 }}>
                  <div
                    style={{
                      width: "90px",
                      height: "90px",
                      margin: "0 auto 16px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Avatar
                      size={72}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#1890ff" }}
                    />
                  </div>
                  <Title level={4} style={{ margin: "0 0 8px 0", fontSize: 18 }}>
                    {user?.name || "User"}
                  </Title>
                  </Col>

                {/* Profile Form Fields Section */}
                <Col xs={24} sm={16}>
                  <Form form={profileForm} layout="vertical" onFinish={handleProfileUpdate}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                      <Input prefix={<UserOutlined />} size="large" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
                      <Input prefix={<MailOutlined />} size="large" />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone">
                      <Input prefix={<PhoneOutlined />} size="large" />
                    </Form.Item>
                    
                    {/* Buttons Area */}
                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                      <Row justify="end">
                        <Space size="middle">
                          <Button
                            type="primary"
                            onClick={() => setIsPasswordModalOpen(true)}
                            icon={<LockOutlined />}
                            size="large"
                          >
                            Password Reset
                          </Button>
                        </Space>
                      </Row>
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* ညာဘက်ခြမ်း: System Settings Card (အကျယ် 50% စီ မျှတစွာ ယူထားပါတယ်) */}
          {user?.role === "ADMIN" && (
            <Col xs={24} md={12} lg={12}>
              <Card
                title={
                  <Space>
                    <SettingOutlined style={{ color: "#faad14" }} />
                    <span>System Setting</span>
                  </Space>
                }
                style={{
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  border: "none",
                  height: "100%", 
                }}
                bodyStyle={{
                  height: "calc(100% - 58px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <Form form={systemForm} layout="vertical" onFinish={handleSystemUpdate} style={{ width: "100%" }}>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name="school_start_time" label="School Opening Time" rules={[{ required: true }]}>
                        <TimePicker format="HH:mm" style={{ width: "100%" }} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="school_end_time" label="School Closing Time" rules={[{ required: true }]}>
                        <TimePicker format="HH:mm" style={{ width: "100%" }} size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    name="late_threshold_minutes"
                    label="Late Arrival Period"
                    rules={[{ required: true }]}
                  >
                    <Input
                      addonAfter="Minutes"
                      type="number"
                      placeholder="30"
                      size="large"
                    />
                  </Form.Item>
                  
                  <Form.Item style={{ marginBottom: 0, marginTop: 30, textAlign: "right" }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={sysLoading}
                      size="large"
                      block
                    >
                      Save 
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          )}

        </Row>

        {/* Holiday Calendar Section - Admin အတွက်သာ */}
        {user?.role === "ADMIN" && (
          <Row style={{ marginTop: 24 }}>
            <Col span={24}>
              <HolidayManagement />
            </Col>
          </Row>
        )}

      </div>

      {/* Password Change Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>Password Reset</span>
          </Space>
        }
        open={isPasswordModalOpen}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
        centered
        width={450}
      >
        <div style={{ marginTop: 24 }}>
          <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
            <Form.Item name="currentPassword" label="Old Password" rules={[{ required: true }]}>
              <Input.Password  size="large" />
            </Form.Item>
            <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password  size="large" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confrim Password"
              dependencies={["newPassword"]}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                    return Promise.reject(new Error("No Match Password"));
                  },
                }),
              ]}
            >
              <Input.Password  size="large" />
            </Form.Item>

            <Row justify="end" gutter={8} style={{ marginTop: 24 }}>
              <Col>
                <Button
                  size="large"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    passwordForm.resetFields();
                  }}
                >
                 Cancel
                </Button>
              </Col>
              <Col>
                <Button type="primary" htmlType="submit" primary size="large">
                  Confirm
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </div>
  );
}

