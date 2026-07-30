import { useEffect } from "react";
import { Form, Input, Button, Card, Typography, Divider, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../../redux/slices/authSlice";

const { Title, Text } = Typography;

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  // Page ပြောင်းရင် error ရှင်း
  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  const onFinish = async (values) => {
    const result = await dispatch(loginUser(values));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/dashboard');
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0, // အပေါ်ဆုံး ကပ်မယ်
        left: 0,
        background: "#fff",
      }}
    >
      <Card style={{ width: 400, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3}>RFID ATTENDANCE SYSTEM</Title>
        </div>

        {error && (
          <Alertsssssss
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form name="login" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Email ထည့်ပါ" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Password ထည့်ပါ" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
