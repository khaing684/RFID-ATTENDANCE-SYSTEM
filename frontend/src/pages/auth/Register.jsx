import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../redux/slices/authSlice';

const { Title, Text } = Typography;

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((state) => state.auth);

  // Register ပြီးရင် dashboard ပို့
  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  // Page ပြောင်းရင် error ရှင်း
  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  const onFinish = (values) => {
    dispatch(registerUser(values));
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>RFID စနစ်</Title>
          <Text type="secondary">အကောင့်အသစ်ဖွင့်ရန်</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form name="register" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="name" rules={[{ required: true, message: 'အမည်ထည့်ပါ' }]}>
            <Input prefix={<UserOutlined />} placeholder="အမည်" />
          </Form.Item>
          <Form.Item name="email" rules={[
            { required: true, message: 'Email ထည့်ပါ' },
            { type: 'email', message: 'Email ပုံစံမှန်ထည့်ပါ' },
          ]}>
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[
            { required: true, message: 'Password ထည့်ပါ' },
            { min: 6, message: 'အနည်းဆုံး စာလုံး ၆ လုံးထည့်ပါ' },
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              အကောင့်ဖွင့်မည်
            </Button>
          </Form.Item>
        </Form>

        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Text>အကောင့်ရှိပြီးသားလား </Text>
          <Link to="/login">အကောင့်ဝင်မည်</Link>
        </div>
      </Card>
    </div>
  );
}