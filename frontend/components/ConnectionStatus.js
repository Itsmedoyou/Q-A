import { useState, useEffect } from 'react';

export default function ConnectionStatus({ connected }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (connected) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [connected]);

  if (!visible && connected) {
    return null;
  }

  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
      {connected ? 'Connected' : 'Disconnected - Reconnecting...'}
    </div>
  );
}
