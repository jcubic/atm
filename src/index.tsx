import { createCliRenderer } from '@opentui/core';
import { createRoot, useTerminalDimensions } from '@opentui/react';
import { Figlet } from './lib/figlet';

function App() {
  const { width, height } = useTerminalDimensions();

  return (
    <box alignItems="center" justifyContent="center" flexGrow={1} flexDirection="column" gap={1}>
      {/* Responsive figlet - adjusts to terminal width */}
      <Figlet text="OpenTUI" font="Standard" responsive fg="#7aa2f7" />

      {/* Fixed width example */}
      <Figlet text="Figlet" font="Small" fg="#9ece6a" />

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
