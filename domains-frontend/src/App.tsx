import { BrowserRouter } from 'react-router';
import router from './router';

const App = () => {
  return <BrowserRouter>{router()}</BrowserRouter>;
};

export default App;
