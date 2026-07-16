import { Card, Form, Input, Button, Typography, message, Avatar, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Settings() {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleProfileUpdate = (values) => {
    message.success('Profile သိမ်းပြီး (demo)');
    console.log('Profile Update:', values);
  };

  const handlePasswordChange = (values) => {
    message.success('Password ပြောင်းပြီး (demo)');
    passwordForm.resetFields();
  };

  return (
    <>
      <Title level={4} style={{ marginBottom: 24 }}>Settings</Title>
      <Row gutter={24}>
        <Col xs={24} lg={8}>
          <Card style={{ textAlign: 'center', marginBottom: 16 }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0 }}>User</Title>
            <Text type="secondary">user@example.com</Text>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Profile ပြင်မည်" style={{ marginBottom: 16 }}>
            <Form form={profileForm} layout="vertical" onFinish={handleProfileUpdate}>
              <Form.Item name="name" label="အမည်" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined />} />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input prefix={<MailOutlined />} />
              </Form.Item>
              <Form.Item name="phone" label="ဖုန်း">
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block>သိမ်းမည်</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Password ပြောင်းမည်" style={{ marginBottom: 16 }}>
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
              <Form.Item name="currentPassword" label="လက်ရှိ Password" rules={[{ required: true }]}>
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item name="newPassword" label="Password အသစ်" rules={[{ required: true, min: 6 }]}>
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Password အတည်ပြု"
                dependencies={['newPassword']}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                      return Promise.reject(new Error('Password တူရပါမည်'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} danger block>Password ပြောင်းမည်</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
}
