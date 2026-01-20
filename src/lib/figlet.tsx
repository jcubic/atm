import figlet from 'figlet';
import { useTerminalDimensions } from '@opentui/react';
import { useState, useEffect, useMemo } from 'react';

type FigletFont = figlet.Fonts;
type FigletKerning = figlet.KerningMethods;

/**
 * Props for the Figlet component
 */
export interface FigletProps {
  /** Text to render as ASCII art */
  text: string;
  /** FIGlet font to use (default: "Standard") */
  font?: FigletFont;
  /** Horizontal layout mode */
  horizontalLayout?: FigletKerning;
  /** Vertical layout mode */
  verticalLayout?: FigletKerning;
  /**
   * Enable responsive mode - automatically adjusts width to terminal size
   * When true, uses terminal width. Can also be a number (0-1) as percentage of terminal width.
   */
  responsive?: boolean | number;
  /**
   * Fixed width override (ignored if responsive is enabled)
   */
  width?: number;
  /** Break on whitespace when width-constrained */
  whitespaceBreak?: boolean;
  /** Foreground color */
  fg?: string;
  /** Background color */
  bg?: string;
  /** Fallback text to show while loading or on error */
  fallback?: string;
}

interface InternalFigletOptions {
  font: FigletFont;
  horizontalLayout: FigletKerning;
  verticalLayout: FigletKerning;
  whitespaceBreak: boolean;
  width?: number;
}

/**
 * Hook to generate figlet ASCII art text
 *
 * @example
 * ```tsx
 * function App() {
 *   const asciiArt = useFiglet("Hello", { font: "Standard", responsive: true });
 *   return <text>{asciiArt}</text>;
 * }
 * ```
 */
export function useFiglet(
  text: string,
  options: Omit<FigletProps, 'text' | 'fg' | 'bg' | 'fallback'> = {}
): string {
  const {
    font = 'Standard',
    horizontalLayout = 'default',
    verticalLayout = 'default',
    responsive = false,
    width: fixedWidth,
    whitespaceBreak = true,
  } = options;

  const { width: terminalWidth } = useTerminalDimensions();
  const [asciiArt, setAsciiArt] = useState<string>('');

  // Calculate effective width
  const effectiveWidth = useMemo(() => {
    if (responsive) {
      const percentage = typeof responsive === 'number' ? responsive : 1;
      return Math.floor(terminalWidth * Math.min(1, Math.max(0, percentage)));
    }
    return fixedWidth;
  }, [responsive, terminalWidth, fixedWidth]);

  useEffect(() => {
    const figletOptions: InternalFigletOptions = {
      font,
      horizontalLayout,
      verticalLayout,
      whitespaceBreak,
    };

    // Only set width if we have one
    if (effectiveWidth !== undefined) {
      figletOptions.width = effectiveWidth;
    }

    figlet.text(text, figletOptions, (err, result) => {
      if (err) {
        console.error('Figlet error:', err);
        setAsciiArt(text);
      } else {
        setAsciiArt(result || text);
      }
    });
  }, [text, font, horizontalLayout, verticalLayout, effectiveWidth, whitespaceBreak]);

  return asciiArt;
}

/**
 * Synchronous hook for figlet - works with Node.js/Bun
 *
 * @example
 * ```tsx
 * function App() {
 *   const asciiArt = useFigletSync("Hello", { font: "Standard" });
 *   return <text>{asciiArt}</text>;
 * }
 * ```
 */
export function useFigletSync(
  text: string,
  options: Omit<FigletProps, 'text' | 'fg' | 'bg' | 'fallback'> = {}
): string {
  const {
    font = 'Standard',
    horizontalLayout = 'default',
    verticalLayout = 'default',
    responsive = false,
    width: fixedWidth,
    whitespaceBreak = true,
  } = options;

  const { width: terminalWidth } = useTerminalDimensions();

  // Calculate effective width
  const effectiveWidth = useMemo(() => {
    if (responsive) {
      const percentage = typeof responsive === 'number' ? responsive : 1;
      return Math.floor(terminalWidth * Math.min(1, Math.max(0, percentage)));
    }
    return fixedWidth;
  }, [responsive, terminalWidth, fixedWidth]);

  // Generate ASCII art synchronously
  const asciiArt = useMemo(() => {
    try {
      const figletOptions: InternalFigletOptions = {
        font,
        horizontalLayout,
        verticalLayout,
        whitespaceBreak,
      };

      if (effectiveWidth !== undefined) {
        figletOptions.width = effectiveWidth;
      }

      return figlet.textSync(text, figletOptions);
    } catch (error) {
      console.error('Figlet sync error:', error);
      return text;
    }
  }, [text, font, horizontalLayout, verticalLayout, effectiveWidth, whitespaceBreak]);

  return asciiArt;
}

/**
 * Responsive Figlet ASCII art component
 *
 * Renders text as ASCII art using FIGlet fonts. Supports responsive sizing
 * that automatically adjusts to terminal width.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Figlet text="Hello" />
 *
 * // With custom font
 * <Figlet text="Title" font="Big" />
 *
 * // Responsive - fills terminal width
 * <Figlet text="Welcome" responsive />
 *
 * // Responsive at 80% of terminal width
 * <Figlet text="Welcome" responsive={0.8} />
 *
 * // With colors
 * <Figlet text="Styled" fg="#00ff00" bg="#000000" />
 * ```
 */
export function Figlet({
  text,
  font = 'Standard',
  horizontalLayout = 'default',
  verticalLayout = 'default',
  responsive = false,
  width,
  whitespaceBreak = true,
  fg,
  bg,
  fallback,
}: FigletProps) {
  const asciiArt = useFiglet(text, {
    font,
    horizontalLayout,
    verticalLayout,
    responsive,
    width,
    whitespaceBreak,
  });

  // Show fallback while loading
  const displayText = asciiArt || fallback || text;

  return (
    <text fg={fg} bg={bg}>
      {displayText}
    </text>
  );
}

/**
 * Get list of available figlet fonts
 */
export async function getFigletFonts(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    figlet.fonts((err, fonts) => {
      if (err) {
        reject(err);
      } else {
        resolve(fonts || []);
      }
    });
  });
}

/**
 * Preload a figlet font for synchronous usage
 */
export function preloadFont(fontName: string, fontData: string): void {
  figlet.parseFont(fontName, fontData);
}

// Re-export figlet for advanced usage
export { figlet };
export type { FigletFont, FigletKerning };
