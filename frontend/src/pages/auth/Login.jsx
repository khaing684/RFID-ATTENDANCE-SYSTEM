import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../redux/slices/authSlice';

const { Title, Text } = Typography;

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((state) => state.auth);

  // Login ပြီးသွားရင် dashboard ကိုပို့
  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  // Page ပြောင်းရင် error ရှင်း
  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  const onFinish = (values) => {
    dispatch(loginUser(values));
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>RFID စနစ်</Title>
          <Text type="secondary">အကောင့်ဝင်ရန်</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form name="login" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, message: 'Email ထည့်ပါ' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Password ထည့်ပါ' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              ဝင်မည်
            </Button>
          </Form.Item>
        </Form>

        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Text>အကောင့်မရှိသေးဘူးလား </Text>
          <Link to="/register">အကောင့်ဖွင့်မည်</Link>
        </div>
      </Card>
    </div>
  );
}