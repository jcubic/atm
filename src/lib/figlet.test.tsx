import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, render, waitFor } from "@testing-library/react";

// Mock figlet
vi.mock("figlet", () => ({
  default: {
    text: vi.fn((text: string, options: unknown, callback: (err: Error | null, result?: string) => void) => {
      callback(null, `ASCII_ART:${text}`);
    }),
    textSync: vi.fn((text: string) => `ASCII_ART_SYNC:${text}`),
    fonts: vi.fn((callback: (err: Error | null, fonts?: string[]) => void) => {
      callback(null, ["Standard", "Big", "Small"]);
    }),
    parseFont: vi.fn(),
  },
}));

// Mock useTerminalDimensions
const mockTerminalWidth = vi.fn(() => 80);
vi.mock("@opentui/react", () => ({
  useTerminalDimensions: () => ({
    width: mockTerminalWidth(),
    height: 24,
  }),
}));

// Import after mocks
import { useFiglet, useFigletSync, getFigletFonts, preloadFont, Figlet } from "./figlet";
import figlet from "figlet";

describe("useFiglet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTerminalWidth.mockReturnValue(80);
  });

  it("should call figlet.text with default options", async () => {
    const { result } = renderHook(() => useFiglet("Hello"));

    await waitFor(() => {
      expect(result.current).toBe("ASCII_ART:Hello");
    });

    expect(figlet.text).toHaveBeenCalledWith(
      "Hello",
      expect.objectContaining({
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
        whitespaceBreak: true,
      }),
      expect.any(Function)
    );
  });

  it("should use custom font option", async () => {
    const { result } = renderHook(() => useFiglet("Test", { font: "Big" }));

    await waitFor(() => {
      expect(result.current).toBe("ASCII_ART:Test");
    });

    expect(figlet.text).toHaveBeenCalledWith(
      "Test",
      expect.objectContaining({ font: "Big" }),
      expect.any(Function)
    );
  });

  it("should use fixed width when provided", async () => {
    const { result } = renderHook(() => useFiglet("Test", { width: 40 }));

    await waitFor(() => {
      expect(result.current).toBe("ASCII_ART:Test");
    });

    expect(figlet.text).toHaveBeenCalledWith(
      "Test",
      expect.objectContaining({ width: 40 }),
      expect.any(Function)
    );
  });

  it("should calculate responsive width from terminal width", async () => {
    mockTerminalWidth.mockReturnValue(100);

    const { result } = renderHook(() => useFiglet("Test", { responsive: true }));

    await waitFor(() => {
      expect(result.current).toBe("ASCII_ART:Test");
    });

    expect(figlet.text).toHaveBeenCalledWith(
      "Test",
      expect.objectContaining({ width: 100 }),
      expect.any(Function)
    );
  });

  it("should calculate responsive width as percentage", async () => {
    mockTerminalWidth.mockReturnValue(100);

    const { result } = renderHook(() => useFiglet("Test", { responsive: 0.5 }));

    await waitFor(() => {
      expect(result.current).toBe("ASCII_ART:Test");
    });

    expect(figlet.text).toHaveBeenCalledWith(
      "Test",
      expect.objectContaining({ width: 50 }),
      expect.any(Function)
    );
  });

  it("should clamp responsive percentage between 0 and 1", async () => {
    mockTerminalWidth.mockReturnValue(100);

    // Test value > 1
    renderHook(() => useFiglet("Test", { responsive: 1.5 }));

    await waitFor(() => {
      expect(figlet.text).toHaveBeenCalledWith(
        "Test",
        expect.objectContaining({ width: 100 }),
        expect.any(Function)
      );
    });
  });

  it("should return original text on error", async () => {
    vi.mocked(figlet.text).mockImplementationOnce(
      (text: string, options: unknown, callback: (err: Error | null, result?: string) => void) => {
        callback(new Error("Font not found"));
      }
    );

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useFiglet("Fallback"));

    await waitFor(() => {
      expect(result.current).toBe("Fallback");
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("useFigletSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTerminalWidth.mockReturnValue(80);
  });

  it("should call figlet.textSync with default options", () => {
    const { result } = renderHook(() => useFigletSync("Hello"));

    expect(result.current).toBe("ASCII_ART_SYNC:Hello");
    expect(figlet.textSync).toHaveBeenCalledWith(
      "Hello",
      expect.objectContaining({
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
        whitespaceBreak: true,
      })
    );
  });

  it("should use custom font option", () => {
    const { result } = renderHook(() => useFigletSync("Test", { font: "Big" }));

    expect(result.current).toBe("ASCII_ART_SYNC:Test");
    expect(figlet.textSync).toHaveBeenCalledWith(
      "Test",
      expect.objectContaining({ font: "Big" })
    );
  });

  it("should calculate responsive width", () => {
    mockTerminalWidth.mockReturnValue(120);

    const { result } = renderHook(() => useFigletSync("Test", { responsive: 0.75 }));

    expect(result.current).toBe("ASCII_ART_SYNC:Test");
    expect(figlet.textSync).toHaveBeenCalledWith(
      "Test",
      expect.objectContaining({ width: 90 })
    );
  });

  it("should return original text on error", () => {
    vi.mocked(figlet.textSync).mockImplementationOnce(() => {
      throw new Error("Font not found");
    });

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useFigletSync("Fallback"));

    expect(result.current).toBe("Fallback");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("getFigletFonts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return list of fonts", async () => {
    const fonts = await getFigletFonts();

    expect(fonts).toEqual(["Standard", "Big", "Small"]);
    expect(figlet.fonts).toHaveBeenCalled();
  });

  it("should reject on error", async () => {
    vi.mocked(figlet.fonts).mockImplementationOnce(
      (callback: (err: Error | null, fonts?: string[]) => void) => {
        callback(new Error("Failed to load fonts"));
      }
    );

    await expect(getFigletFonts()).rejects.toThrow("Failed to load fonts");
  });
});

describe("preloadFont", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call figlet.parseFont with font name and data", () => {
    preloadFont("CustomFont", "font-data-here");

    expect(figlet.parseFont).toHaveBeenCalledWith("CustomFont", "font-data-here");
  });
});

describe("Figlet component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTerminalWidth.mockReturnValue(80);
  });

  it("should render ASCII art text", async () => {
    const { container } = render(<Figlet text="Hello" />);

    await waitFor(() => {
      expect(container.textContent).toBe("ASCII_ART:Hello");
    });
  });

  it("should pass font option to useFiglet", async () => {
    render(<Figlet text="Test" font="Big" />);

    await waitFor(() => {
      expect(figlet.text).toHaveBeenCalledWith(
        "Test",
        expect.objectContaining({ font: "Big" }),
        expect.any(Function)
      );
    });
  });

  it("should pass responsive option to useFiglet", async () => {
    mockTerminalWidth.mockReturnValue(100);

    render(<Figlet text="Test" responsive={0.5} />);

    await waitFor(() => {
      expect(figlet.text).toHaveBeenCalledWith(
        "Test",
        expect.objectContaining({ width: 50 }),
        expect.any(Function)
      );
    });
  });

  it("should pass width option to useFiglet", async () => {
    render(<Figlet text="Test" width={60} />);

    await waitFor(() => {
      expect(figlet.text).toHaveBeenCalledWith(
        "Test",
        expect.objectContaining({ width: 60 }),
        expect.any(Function)
      );
    });
  });

  it("should show fallback text while loading", () => {
    // Make figlet.text not call callback immediately to simulate loading
    vi.mocked(figlet.text).mockImplementationOnce(() => {
      // Don't call callback - simulates pending state
    });

    const { container } = render(<Figlet text="Hello" fallback="Loading..." />);

    expect(container.textContent).toBe("Loading...");
  });

  it("should show original text as fallback when no fallback prop provided", () => {
    vi.mocked(figlet.text).mockImplementationOnce(() => {
      // Don't call callback - simulates pending state
    });

    const { container } = render(<Figlet text="Hello" />);

    expect(container.textContent).toBe("Hello");
  });

  it("should pass layout options to useFiglet", async () => {
    render(
      <Figlet
        text="Test"
        horizontalLayout="full"
        verticalLayout="full"
        whitespaceBreak={false}
      />
    );

    await waitFor(() => {
      expect(figlet.text).toHaveBeenCalledWith(
        "Test",
        expect.objectContaining({
          horizontalLayout: "full",
          verticalLayout: "full",
          whitespaceBreak: false,
        }),
        expect.any(Function)
      );
    });
  });
});
