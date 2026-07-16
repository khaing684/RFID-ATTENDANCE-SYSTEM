import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Result
        status="404"
        title="404"
        subTitle="ဤစာမျက်နှာ မတွေ့ပါ"
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Dashboard သို့ ပြန်သွားမည်
          </Button>
        }
      />
    </div>
  );
}