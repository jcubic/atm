import { createCliRenderer } from '@opentui/core';
import { createRoot, useTerminalDimensions } from '@opentui/react';
import { Figlet } from './lib/figlet';

function App() {
  const { width, height } = useTerminalDimensions();

  return (
    <box alignItems="center" justifyContent="center" flexGrow={1} flexDirection="column" gap={1}>
      <Figlet text="ATM is Terminal Multiplexer" font="Rectangles" responsive fg="#FFCE00" />
      <text>
        Terminal size: {width}x{height} - Resize to see responsive text adjust
      </text>
    </box>
  );
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
});
createRoot(renderer).render(<App />);
