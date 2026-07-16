import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import { BrowserRouter} from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import store from './redux/store';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          }
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
    </Provider>
  </StrictMode>
);
