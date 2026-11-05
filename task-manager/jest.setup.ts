import "@testing-library/jest-dom";

jest.mock("@/trpc/client", () => ({
  useTRPC: jest.fn(),
}));

afterEach(() => {
  jest.restoreAllMocks();
});
